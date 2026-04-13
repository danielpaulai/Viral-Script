import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import * as fs from "fs";

const { Pool } = pg;

// Track if database is available
export let isDatabaseAvailable = false;

// Validate if URL is a valid PostgreSQL connection string
function isValidPostgresUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

// Get database URL - in production it may be in /tmp/replitdb
function getDatabaseUrl(): string | null {
  // First check environment variable
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL.trim();
    if (isValidPostgresUrl(url)) {
      return url;
    }
    console.log("[DB] DATABASE_URL is not a valid PostgreSQL connection string");
    return null;
  }
  
  // In production, check /tmp/replitdb
  try {
    if (fs.existsSync("/tmp/replitdb")) {
      const url = fs.readFileSync("/tmp/replitdb", "utf-8").trim();
      if (url && isValidPostgresUrl(url)) {
        console.log("Using database URL from /tmp/replitdb");
        return url;
      }
    }
  } catch (e) {
    console.log("Could not read /tmp/replitdb:", e);
  }
  
  return null;
}

const databaseUrl = getDatabaseUrl();
console.log("[DB] Environment:", process.env.REPLIT_DEPLOYMENT ? "PRODUCTION" : "DEVELOPMENT");
console.log("[DB] Valid DATABASE_URL available:", !!databaseUrl);

// Create pool and db only if we have a valid database URL
export let pool: pg.Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (databaseUrl) {
  try {
    pool = new Pool({ 
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
    });
    db = drizzle(pool, { schema });
    
    // Test connection
    pool.query('SELECT 1').then(() => {
      isDatabaseAvailable = true;
      console.log("Database connection successful");
    }).catch((err) => {
      console.log("Database connection failed, using memory storage:", err.message);
      isDatabaseAvailable = false;
    });
  } catch (e) {
    console.log("Failed to create database pool:", e);
  }
} else {
  console.log("No valid DATABASE_URL found, using memory storage");
}
