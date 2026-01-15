import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

// Helper to calculate trial end date (7 days from now)
function getTrialEndDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not available");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!db) throw new Error("Database not available");
    
    // Check if user already exists
    const existingUser = await this.getUser(userData.id as string);
    
    // For new users, set up 7-day free trial
    const insertData = existingUser ? userData : {
      ...userData,
      trialEndsAt: getTrialEndDate(),
      trialScriptsUsed: 0,
    };
    
    // On conflict update, preserve trial dates if they exist, or set them if missing
    const updateData: any = {
      ...userData,
      updatedAt: new Date(),
    };
    
    // If existing user has no trial end date, set it now (migration for legacy users)
    if (existingUser && !existingUser.trialEndsAt) {
      updateData.trialEndsAt = getTrialEndDate();
    }
    
    const [user] = await db
      .insert(users)
      .values(insertData)
      .onConflictDoUpdate({
        target: users.id,
        set: updateData,
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
