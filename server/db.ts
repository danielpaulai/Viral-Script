import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import * as fs from "fs";

const { Pool } = pg;

// Get database URL - in production it may be in /tmp/replitdb
function getDatabaseUrl(): string {
  // First check environment variable
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // In production, check /tmp/replitdb
  try {
    if (fs.existsSync("/tmp/replitdb")) {
      const url = fs.readFileSync("/tmp/replitdb", "utf-8").trim();
      if (url) {
        console.log("Using database URL from /tmp/replitdb");
        return url;
      }
    }
  } catch (e) {
    console.log("Could not read /tmp/replitdb:", e);
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
