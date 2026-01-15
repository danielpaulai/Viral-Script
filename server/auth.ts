console.log("🔐 AUTH.TS LOADED - HYBRID VERSION WITH SUPABASE");

import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { authCredentialsSchema } from "@shared/schema";
import crypto from "crypto";

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) {
      resolve(false);
      return;
    }
    crypto.scrypt(supplied, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === hash);
    });
  });
}

export function setupAuth(app: Express) {
  // On Replit, even in development, the app is served over HTTPS via proxy
  const isReplit = !!process.env.REPL_ID;
  const isProduction = process.env.NODE_ENV === "production";
  const useSecureCookies = isReplit || isProduction;
  
  // For cross-origin auth flows (production deployments), use sameSite: "none"
  // This is required when the app is accessed from external domains
  const sameSiteValue = useSecureCookies ? "none" as const : "lax" as const;
  
  console.log(`Session config: Replit=${isReplit}, Production=${isProduction}, SecureCookies=${useSecureCookies}, SameSite=${sameSiteValue}`);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: useSecureCookies,
      httpOnly: true,
      sameSite: sameSiteValue,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  app.post("/api/register", async (req, res) => {
    try {
      console.log("Registration attempt:", { username: req.body?.username });

      const parsed = authCredentialsSchema.safeParse(req.body);

      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => e.message).join(", ");
        console.log("Registration validation failed:", errors);
        return res.status(400).json({ message: errors });
      }

      const { username, password } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Registration failed: Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }

      let supabaseUserId: string | null = null;
      try {
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: username,
            password: password,
            email_confirm: true,
          });

        if (authError) {
          console.error("Supabase auth error:", authError);
        } else if (authData.user) {
          supabaseUserId = authData.user.id;
          console.log("User created in Supabase:", supabaseUserId);
        }
      } catch (supabaseError) {
        console.error("Supabase error (continuing with local):", supabaseError);
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });
      console.log("User created in Replit DB:", newUser.id);

      // Regenerate session to ensure fresh cookie with correct SameSite/Secure settings
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regenerate error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      req.session.userId = newUser.id;
      req.session.userEmail = username;
      
      // Explicitly save session before responding to ensure cookie is set
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully for user:", newUser.id);
            resolve();
          }
        });
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Registration failed. Please try again.",
      });
    }
  });

  // Debug test endpoint to verify routing works in production
  app.post("/api/login-test", (req, res) => {
    console.log("=== LOGIN TEST ENDPOINT HIT ===", {
      body: req.body,
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });
    res.json({ 
      message: "Login test endpoint is reachable", 
      receivedBody: req.body,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });
  });

  app.post("/api/login", async (req, res) => {
    // CRITICAL DEBUG: Log at very start to confirm endpoint is hit
    console.log("=== LOGIN ENDPOINT HIT ===", { 
      username: req.body?.username,
      hasPassword: !!req.body?.password,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });

    try {
      console.log("Login attempt:", { username: req.body?.username });

      const parsed = authCredentialsSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      const { username, password, rememberMe } = parsed.data;

      let supabaseSuccess = false;
      let supabaseUserId: string | null = null;
      try {
        console.log("Attempting Supabase auth for:", username);
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: username,
            password: password,
          });

        console.log("Supabase auth response:", {
          hasUser: !!authData?.user,
          userId: authData?.user?.id,
          error: authError?.message,
          errorCode: authError?.status,
        });

        if (!authError && authData.user) {
          supabaseSuccess = true;
          supabaseUserId = authData.user.id;
          console.log("Login successful via Supabase:", authData.user.id);
        } else if (authError) {
          console.log("Supabase auth error details:", {
            message: authError.message,
            status: authError.status,
            name: authError.name,
          });
        }
      } catch (supabaseError: any) {
        console.log("Supabase auth exception:", {
          message: supabaseError?.message,
          name: supabaseError?.name,
        });
      }

      console.log("Looking up user in database:", username);
      let user = await storage.getUserByUsername(username);
      console.log("Database user lookup result:", {
        found: !!user,
        userId: user?.id,
        hasPassword: !!user?.password,
        username: user?.username,
      });
      
      // If Supabase auth succeeded but no local user exists, create one with trial data
      if (!user && supabaseSuccess) {
        console.log("Creating local user record for Supabase-authenticated user:", username);
        const hashedPassword = await hashPassword(password);
        user = await storage.createUser({
          username,
          password: hashedPassword,
          email: username,
        });
        console.log("Local user created with trial data:", user.id);
        
        // Link Supabase user ID to local record
        if (supabaseUserId) {
          try {
            const { pool } = await import("./db");
            if (pool) {
              await pool.query(
                `UPDATE users SET supabase_user_id = $1 WHERE id = $2 AND supabase_user_id IS NULL`,
                [supabaseUserId, user.id]
              );
              console.log("Linked Supabase user ID to local user:", supabaseUserId);
            }
          } catch (e) {
            console.error("Failed to link Supabase user ID:", e);
          }
        }
      }
      
      // If user exists and Supabase auth succeeded, update supabase_user_id if not set
      if (user && supabaseSuccess && supabaseUserId) {
        try {
          const { pool } = await import("./db");
          if (pool) {
            await pool.query(
              `UPDATE users SET supabase_user_id = $1 WHERE id = $2 AND supabase_user_id IS NULL`,
              [supabaseUserId, user.id]
            );
          }
        } catch (e) {
          console.error("Failed to update Supabase user ID:", e);
        }
      }
      
      if (!user) {
        console.log("Login failed: User not found in Replit DB");
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Ensure existing users have trial data set (backfill for older accounts)
      if (user.trialEndsAt === null && user.plan !== 'admin') {
        console.log("Backfilling trial data for existing user:", user.id);
        try {
          const { pool } = await import("./db");
          if (pool) {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 7);
            await pool.query(
              `UPDATE users SET trial_ends_at = $1, trial_scripts_used = COALESCE(trial_scripts_used, 0) WHERE id = $2`,
              [trialEndsAt, user.id]
            );
            console.log("Trial data backfilled for user:", user.id);
          }
        } catch (e) {
          console.error("Failed to backfill trial data:", e);
        }
      }

      if (!supabaseSuccess) {
        if (!user.password) {
          console.log("Login failed: No password set for local auth");
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          console.log("Login failed: Invalid password (local auth)");
          return res.status(401).json({ message: "Invalid email or password" });
        }
        console.log("Login successful via local auth:", user.id);
      }

      // Regenerate session to ensure fresh cookie with correct SameSite/Secure settings
      // This fixes issues where users have stale sessions with old cookie attributes
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regenerate error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      req.session.userId = user.id;
      req.session.userEmail = user.username || undefined;
      
      // Set session duration based on rememberMe
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
      }
      
      // Explicitly save session before responding to ensure cookie is set
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            console.log("Session saved successfully for user:", user.id);
            resolve();
          }
        });
      });

      res.status(200).json({
        id: user.id,
        username: user.username,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.sendStatus(401);
      }

      const user = await storage.getUser(req.session.userId);

      if (!user) {
        return res.sendStatus(401);
      }

      console.log("User retrieved from Replit DB:", user.id);

      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.sendStatus(401);
    }
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session.userId) {
    // Set req.user so routes can access user info
    req.user = {
      id: req.session.userId,
      email: req.session.userEmail,
    };
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function setupPasswordReset(app: Express) {
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Build the correct redirect URL with https:// prefix
      let redirectUrl = 'http://localhost:5000/reset-password';
      if (process.env.REPLIT_DEV_DOMAIN) {
        redirectUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/reset-password`;
      } else if (process.env.REPLIT_DOMAINS) {
        // Use the first domain from REPLIT_DOMAINS
        const domain = process.env.REPLIT_DOMAINS.split(',')[0];
        redirectUrl = `https://${domain}/reset-password`;
      }
      
      console.log("Password reset redirectTo:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Password reset error:", error);
        return res.status(400).json({ message: "Failed to send reset email" });
      }

      console.log("Password reset email sent to:", email);
      res.json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to send reset email" });
    }
  });
  
  // Handle Supabase token-based password reset
  app.post("/api/reset-password-supabase", async (req, res) => {
    try {
      const { accessToken, password } = req.body;
      
      if (!accessToken || !password) {
        return res.status(400).json({ message: "Access token and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Create a new Supabase client with the user's access token
      const { createClient } = await import("@supabase/supabase-js");
      const userSupabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );
      
      // Update the user's password using their session
      const { error: updateError } = await userSupabase.auth.updateUser({
        password: password,
      });
      
      if (updateError) {
        console.error("Supabase password update error:", updateError);
        return res.status(400).json({ message: updateError.message || "Failed to reset password" });
      }
      
      console.log("Password reset successfully via Supabase");
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}
