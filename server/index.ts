import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';

// ============================================================
// ENVIRONMENT DIAGNOSTIC - Runs at startup
// ============================================================
console.log('='.repeat(60));
console.log('ENVIRONMENT DIAGNOSTIC');
console.log('='.repeat(60));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REPLIT_DEPLOYMENT:', process.env.REPLIT_DEPLOYMENT);
console.log('Is Production Deployment:', !!process.env.REPLIT_DEPLOYMENT);
console.log('');
console.log('--- OpenAI/AI Integration ---');
console.log('AI_INTEGRATIONS_OPENAI_API_KEY exists:', !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
console.log('AI_INTEGRATIONS_OPENAI_API_KEY length:', process.env.AI_INTEGRATIONS_OPENAI_API_KEY ? process.env.AI_INTEGRATIONS_OPENAI_API_KEY.length : 0);
console.log('AI_INTEGRATIONS_OPENAI_BASE_URL:', process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'NOT SET');
console.log('');
console.log('--- Supabase ---');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('');
console.log('--- Database ---');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('');
console.log('--- Session ---');
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('='.repeat(60));

// Validate critical configuration
function validateConfiguration() {
  const issues: string[] = [];
  
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    issues.push('AI_INTEGRATIONS_OPENAI_API_KEY is not set - AI features will fail');
  }
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    issues.push('AI_INTEGRATIONS_OPENAI_BASE_URL is not set - AI features will fail');
  }
  if (!process.env.SUPABASE_URL) {
    issues.push('SUPABASE_URL is not set - Authentication will fail');
  }
  if (!process.env.SUPABASE_ANON_KEY) {
    issues.push('SUPABASE_ANON_KEY is not set - Authentication will fail');
  }
  if (!process.env.DATABASE_URL) {
    issues.push('DATABASE_URL is not set - Database features will fail');
  }
  
  if (issues.length > 0) {
    console.log('');
    console.log('CONFIGURATION ISSUES DETECTED:');
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    console.log('');
    if (process.env.REPLIT_DEPLOYMENT) {
      console.log('FIX: Add these secrets to your Deployment settings:');
      console.log('  1. Go to Deployments panel');
      console.log('  2. Click on your active deployment');
      console.log('  3. Go to Settings → Secrets');
      console.log('  4. Add the missing secrets');
      console.log('  5. Redeploy');
    }
    console.log('='.repeat(60));
  } else {
    console.log('All critical configuration is present');
    console.log('='.repeat(60));
  }
  
  return issues.length === 0;
}

validateConfiguration();

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Validate if URL is a valid PostgreSQL connection string
function isValidPostgresUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

// Initialize Stripe schema and sync data on startup
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl || !isValidPostgresUrl(databaseUrl)) {
    console.log('Valid DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    // Set up managed webhook if REPLIT_DOMAINS is available
    const replitDomains = process.env.REPLIT_DOMAINS;
    if (replitDomains) {
      console.log('Setting up managed webhook...');
      const webhookBaseUrl = `https://${replitDomains.split(',')[0]}`;
      try {
        const result = await stripeSync.findOrCreateManagedWebhook(
          `${webhookBaseUrl}/api/stripe/webhook`
        );
        if (result?.webhook?.url) {
          console.log(`Webhook configured: ${result.webhook.url}`);
        } else {
          console.log('Webhook created (no URL returned)');
        }
      } catch (webhookError) {
        console.log('Webhook setup skipped (may already exist or sandbox mode)');
      }
    } else {
      console.log('REPLIT_DOMAINS not set, skipping webhook setup');
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: Error) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// Initialize Stripe (don't await to not block startup)
initStripe();

// Register Stripe webhook route BEFORE express.json() - webhook needs raw Buffer
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('Webhook body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Now apply JSON middleware for all other routes
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
