import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, authCredentialsSchema } from "@shared/schema";
import { Resend } from "resend";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) {
    return false;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", { username: req.body?.username });
      
      const parsed = authCredentialsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        const errors = parsed.error.errors.map(e => e.message).join(", ");
        console.log("Registration validation failed:", errors);
        return res.status(400).json({ message: errors });
      }

      const { username, password } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Registration failed: username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }

      console.log("Creating new user:", username);
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
      });
      console.log("User created successfully:", user.id);

      req.login(user, (err) => {
        if (err) {
          console.error("Login after registration failed:", err);
          return next(err);
        }
        const { password: _, ...safeUser } = user;
        console.log("Registration complete, user logged in:", safeUser.id);
        res.status(201).json(safeUser);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error?.message || "Unknown error";
      const errorCode = error?.code || "";
      console.error("Registration error details:", { message: errorMessage, code: errorCode, stack: error?.stack });
      res.status(500).json({ 
        message: "Registration failed. Please try again.",
        detail: process.env.NODE_ENV === "development" ? errorMessage : undefined
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", { username: req.body?.username });
    passport.authenticate("local", (err: any, user: SelectUser | false, info: { message: string }) => {
      if (err) {
        console.error("Login passport error:", err);
        return res.status(500).json({ message: "Login failed. Please try again." });
      }
      if (!user) {
        console.log("Login failed: invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return res.status(500).json({ message: "Session creation failed. Please try again." });
        }
        const { password: _, ...safeUser } = user;
        console.log("Login successful:", safeUser.id);
        res.status(200).json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password: _, ...safeUser } = req.user as SelectUser;
    res.json(safeUser);
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Generate a secure token for password reset
function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

// Hash a token using SHA-256 for secure storage
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Setup password reset routes
export function setupPasswordReset(app: Express) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Forgot password - send reset email
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email (username is used as email in this app)
      const user = await storage.getUserByUsername(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        console.log("Forgot password: User not found for email:", email);
        return res.json({ message: "If an account exists with this email, a reset link has been sent." });
      }

      // Generate reset token
      const token = generateResetToken();
      const tokenHash = hashToken(token); // Hash token before storing
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

      // Save hashed token to database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: tokenHash, // Store the hash, not the raw token
        expiresAt,
      });

      // Send email
      if (resend) {
        const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${token}`;
        
        try {
          await resend.emails.send({
            from: "Video Script Writer <noreply@resend.dev>",
            to: email,
            subject: "Reset Your Password",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>You requested a password reset for your Video Script Writer account.</p>
                <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
                <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
              </div>
            `,
          });
          console.log("Password reset email sent to:", email);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          return res.status(500).json({ message: "Failed to send reset email. Please try again." });
        }
      } else {
        console.log("Resend not configured. Reset token:", token);
      }

      res.json({ message: "If an account exists with this email, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Reset password - verify token and update password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Reset token is required" });
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Hash the provided token and find it in database
      const tokenHash = hashToken(token);
      const resetToken = await storage.getPasswordResetToken(tokenHash);

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      if (resetToken.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      // Update user password
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used (use hash for lookup)
      await storage.markPasswordResetTokenUsed(tokenHash);

      console.log("Password reset successful for user:", resetToken.userId);
      res.json({ message: "Password has been reset successfully. You can now log in." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Verify reset token (for frontend validation)
  app.get("/api/verify-reset-token", async (req, res) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }

      // Hash the provided token and find it in database
      const tokenHash = hashToken(token);
      const resetToken = await storage.getPasswordResetToken(tokenHash);

      if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
        return res.json({ valid: false, message: "Invalid or expired reset link" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ valid: false, message: "An error occurred" });
    }
  });
}
