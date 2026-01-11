import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { authCredentialsSchema } from "@shared/schema";

export function setupAuth(app: Express) {
  // Session configuration - simplified for Supabase
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Register endpoint
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

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: username,
          password: password,
          email_confirm: true, // Auto-confirm email for now
        });

      if (authError) {
        console.error("Supabase auth error:", authError);
        return res.status(400).json({
          message: authError.message || "Registration failed",
        });
      }

      if (!authData.user) {
        return res.status(400).json({ message: "Failed to create user" });
      }

      console.log("User created in Supabase:", authData.user.id);

      // Store user in session
      req.session.userId = authData.user.id;
      req.session.userEmail = authData.user.email;

      res.status(201).json({
        id: authData.user.id,
        username: authData.user.email,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({
        message: "Registration failed. Please try again.",
      });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      console.log("Login attempt:", { username: req.body?.username });

      const parsed = authCredentialsSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid credentials format" });
      }

      const { username, password } = parsed.data;

      // Sign in with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

      if (authError || !authData.user) {
        console.log("Login failed: invalid credentials");
        return res.status(401).json({ message: "Invalid email or password" });
      }

      console.log("Login successful:", authData.user.id);

      // Store user in session
      req.session.userId = authData.user.id;
      req.session.userEmail = authData.user.email;

      res.status(200).json({
        id: authData.user.id,
        username: authData.user.email,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.sendStatus(401);
      }

      // Get user from Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.admin.getUserById(req.session.userId);

      if (error || !user) {
        return res.sendStatus(401);
      }

      res.json({
        id: user.id,
        username: user.email,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.sendStatus(401);
    }
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Keep the password reset functions - we can implement Supabase version later
export function setupPasswordReset(app: Express) {
  // TODO: Implement Supabase password reset
  app.post("/api/forgot-password", async (req, res) => {
    res.status(501).json({ message: "Password reset not yet implemented" });
  });
}
