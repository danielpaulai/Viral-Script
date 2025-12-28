import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Script Categories
export const scriptCategories = [
  { id: "content_creation", name: "Content Creation & Strategy", description: "Content workflows, filming systems, creator productivity" },
  { id: "business_marketing", name: "Business Building & Marketing", description: "Lead generation, sales strategies, business growth" },
  { id: "ai_technology", name: "AI & Technology", description: "AI tools, tech trends, future implications" },
  { id: "personal_branding", name: "Personal Branding & Community", description: "Authentic brands, engaged communities" },
  { id: "social_growth", name: "Social Media Growth Hacks", description: "Viral strategies, algorithm hacks" },
  { id: "niche_optimization", name: "Niche & Format Optimization", description: "Finding your niche, optimizing formats" },
  { id: "mindset_growth", name: "Mindset & Personal Growth", description: "Self-development, boundaries, life philosophy" },
  { id: "health_science", name: "Health & Science", description: "Health topics, scientific insights, psychology" },
  { id: "wealth_finance", name: "Wealth & Finance", description: "Money mindset, wealth building strategies" },
] as const;

// Hook Formats
export const hookFormats = [
  { id: "personal_experience", name: "Personal Experience", template: "I used to [OLD WAY]. Then I discovered [NEW WAY]. Here's what changed...", example: "I came out here lonely. Didn't know anybody. Had to build from scratch." },
  { id: "case_study", name: "Case Study", template: "[PERSON/BRAND] did [UNEXPECTED THING] and got [SURPRISING RESULT]...", example: "I just sold my company for $10 million. Here are the 3 things that got me there." },
  { id: "secret_reveal", name: "Secret Reveal", template: "Nobody's talking about [HIDDEN TRUTH] but it's about to change everything...", example: "Here's something nobody tells you about self-respect..." },
  { id: "contrarian", name: "Contrarian", template: "[POPULAR BELIEF] is killing your [GOAL]. Here's what actually works...", example: "Educational content is ruining your Instagram sales. Here's why." },
  { id: "question", name: "Question", template: "Ever wonder why [OBSERVATION]? The answer might surprise you...", example: "Why do most businesses fail? It's not what you think." },
  { id: "list", name: "List", template: "[NUMBER] [THINGS] that [OUTCOME]. Number [X] changed everything...", example: "3 substances that can permanently change your personality." },
  { id: "education", name: "Education", template: "Here's how to [ACHIEVE OUTCOME] in [TIME/STEPS]...", example: "Here's how I find viral content ideas in under 5 minutes..." },
  { id: "heres_what_happens", name: "Here's What Happens When", template: "Here's what happens when you [X] for [Y TIME] during [Z]...", example: "Here's what happens when you fast for 30 days during Ramadan." },
  { id: "is_it_just_me", name: "Is It Just Me", template: "Is it just me or [RELATABLE OBSERVATION]?", example: "Is it just me or do you ever get so hungry before you go to sleep and start dreaming about chili oil noodles?" },
  { id: "struggling_with", name: "Are You Struggling With", template: "Are you struggling with [PROBLEM]? Here's a strategy so you can still [DESIRED OUTCOME]...", example: "Are you struggling with diet? Here's a strategy so you can still enjoy the night out." },
] as const;

// Structure Formats
export const structureFormats = [
  { id: "problem_solver", name: "Problem Solver", description: "Set up problem → Present solution", sections: ["Problem Setup (30%)", "Agitation (20%)", "Solution (40%)", "CTA (10%)"] },
  { id: "breakdown", name: "Breakdown", description: "Explain foundational principles", sections: ["Big Picture (20%)", "Component 1 (25%)", "Component 2 (25%)", "Component 3 (20%)", "Synthesis (10%)"] },
  { id: "listicle", name: "Listicle", description: "Numbered list format", sections: ["Hook + Setup (15%)", "Item 1 (20%)", "Item 2 (20%)", "Item 3 (20%)", "Item 4 (15%)", "Wrap (10%)"] },
  { id: "tutorial", name: "Tutorial", description: "Step-by-step walkthrough", sections: ["Setup (15%)", "Step 1 (25%)", "Step 2 (25%)", "Step 3 (25%)", "Result/CTA (10%)"] },
  { id: "story_arc", name: "Story Arc", description: "Narrative with emotional journey", sections: ["Setup (20%)", "Conflict (30%)", "Turning Point (20%)", "Resolution (20%)", "Lesson (10%)"] },
  { id: "educational_motivation", name: "Educational Motivation", description: "Motivate and educate through experience", sections: ["Hook + Context (15%)", "Journey/Experience (35%)", "The Lesson (30%)", "Empowerment (20%)"] },
] as const;

// Tone Options
export const toneOptions = [
  { id: "direct", name: "Direct", description: "Matter-of-fact, no fluff" },
  { id: "high_energy", name: "High Energy", description: "Enthusiastic, excited" },
  { id: "conversational", name: "Conversational", description: "Casual, friendly" },
  { id: "vulnerable", name: "Vulnerable", description: "Open, honest, real" },
  { id: "relaxed", name: "Relaxed", description: "Laid-back, chill" },
] as const;

// Voice Options
export const voiceOptions = [
  { id: "confident", name: "Confident & Commanding", description: "Instructive, expert positioning" },
  { id: "inquisitive", name: "Inquisitive & Bold", description: "Forward-looking, questioning" },
  { id: "relatable", name: "Relatable & Authentic", description: "Human, imperfect, real" },
  { id: "thoughtful", name: "Thoughtful & Introspective", description: "Personal, reflective, deep" },
] as const;

// Pacing Options
export const pacingOptions = [
  { id: "balanced", name: "Balanced", description: "Natural rhythm with pauses" },
  { id: "rapid_fire", name: "Rapid-Fire", description: "Minimal pauses, high momentum" },
  { id: "deliberate", name: "Deliberate", description: "Slower, dramatic emphasis" },
] as const;

// Platform Options
export const platformOptions = [
  { id: "tiktok", name: "TikTok" },
  { id: "instagram_reels", name: "Instagram Reels" },
  { id: "youtube_shorts", name: "YouTube Shorts" },
  { id: "linkedin", name: "LinkedIn" },
] as const;

// Duration Options
export const durationOptions = [
  { id: "15", name: "15 seconds", wordCount: "30-45 words" },
  { id: "30", name: "30 seconds", wordCount: "60-80 words" },
  { id: "60", name: "60 seconds", wordCount: "90-120 words" },
  { id: "90", name: "90 seconds", wordCount: "135-180 words" },
] as const;

// Quick Presets
export const quickPresets = [
  { id: "business_growth", name: "Business Growth Engine", description: "High-converting marketing content", category: "business_marketing", hook: "case_study", structure: "problem_solver", tone: "direct", voice: "confident" },
  { id: "ai_tech", name: "AI & Tech Insider", description: "Futuristic and high-energy tech breakdowns", category: "ai_technology", hook: "secret_reveal", structure: "breakdown", tone: "high_energy", voice: "inquisitive" },
  { id: "viral_growth", name: "Viral Growth Hacks", description: "Fast-paced tips for social growth", category: "social_growth", hook: "list", structure: "listicle", tone: "high_energy", voice: "confident" },
  { id: "personal_brand", name: "Authentic Personal Brand", description: "Relatable storytelling to build trust", category: "personal_branding", hook: "personal_experience", structure: "story_arc", tone: "conversational", voice: "relatable" },
] as const;

// Script Parameters Interface
export interface ScriptParameters {
  topic: string;
  targetAudience?: string;
  callToAction?: string;
  keyFacts?: string;
  platform: string;
  duration: string;
  category: string;
  structure: string;
  hook: string;
  tone?: string;
  voice?: string;
  pacing?: string;
  deepResearch?: boolean;
}

// Generated Script Interface
export interface GeneratedScript {
  id: string;
  script: string;
  wordCount: number;
  gradeLevel: number;
  productionNotes: string;
  bRollIdeas: string[];
  onScreenText: string[];
  parameters: ScriptParameters;
  createdAt: Date;
}

// Database Tables
export const scripts = pgTable("scripts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  script: text("script").notNull(),
  wordCount: text("word_count"),
  gradeLevel: text("grade_level"),
  productionNotes: text("production_notes"),
  bRollIdeas: text("b_roll_ideas"),
  onScreenText: text("on_screen_text"),
  parameters: jsonb("parameters"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vault = pgTable("vault", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scriptId: varchar("script_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertScriptSchema = createInsertSchema(scripts).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertVaultSchema = createInsertSchema(vault).omit({ id: true, createdAt: true });

// Types
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertVault = z.infer<typeof insertVaultSchema>;
export type VaultItem = typeof vault.$inferSelect;

// Keep User types for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
