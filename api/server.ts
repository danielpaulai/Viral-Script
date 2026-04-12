/**
 * Vercel serverless function entry point
 * Wraps the Express app for deployment on Vercel
 * 
 * On Vercel: all /api/* requests are routed here
 * On Replit/local: server/index.ts handles everything
 */

import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();

// Trust proxy (needed behind Vercel's CDN)
app.set("trust proxy", 1);

// Health check (fast response)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", runtime: "vercel", timestamp: new Date().toISOString() });
});

// Register all routes (async setup)
let routesReady = false;
const setup = registerRoutes(createServer(app), app).then(() => {
  routesReady = true;
});

// Serverless handler
export default async function handler(req: any, res: any) {
  if (!routesReady) {
    await setup;
  }
  app(req, res);
}
