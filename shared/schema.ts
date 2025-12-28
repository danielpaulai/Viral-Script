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

// Hook Categories for organization
export const hookCategories = [
  { id: "personal_experience", name: "Personal Experience", description: "Present your unique perspective to build instant credibility" },
  { id: "case_study", name: "Case Study", description: "Highlight someone achieving unexpected results" },
  { id: "secret_reveal", name: "Secret Reveal", description: "Tease insider knowledge for exclusive access feeling" },
  { id: "contrarian", name: "Contrarian", description: "Challenge conventional beliefs to stop the scroll" },
  { id: "question", name: "Question", description: "Frame an opening question that demands an answer" },
  { id: "list", name: "List", description: "Introduce a numbered list that promises organized value" },
  { id: "education", name: "Education", description: "Introduce a step-by-step process for transformation" },
] as const;

// 50 Viral Hooks Database
export const viralHooks = [
  // PERSONAL EXPERIENCE (1-8)
  { id: "painful_past", category: "personal_experience", name: "The Painful Past", template: "I used to [painful thing everyone relates to].", example: "I used to write a script, film, edit, and post all in one day.", why: "Viewers think 'that's me right now' and stay to see the solution." },
  { id: "realization_moment", category: "personal_experience", name: "The Realization Moment", template: "I spent [time period] doing [thing] before I realized [insight].", example: "I spent 3 years posting daily before I realized I was burning out for nothing.", why: "Implies hard-earned wisdom they can get in 60 seconds." },
  { id: "unlikely_start", category: "personal_experience", name: "The Unlikely Start", template: "I [started from unlikely place] and now [impressive result].", example: "I came out here lonely. Didn't know anybody. Had to build from scratch.", why: "Creates a transformation arc viewers want to follow." },
  { id: "confession", category: "personal_experience", name: "The Confession", template: "I'm going to be honest - I [vulnerable admission].", example: "I'm going to be honest - I almost quit content creation last year.", why: "Vulnerability creates instant trust and curiosity." },
  { id: "accidental_discovery", category: "personal_experience", name: "The Accidental Discovery", template: "I accidentally discovered [thing] when I [situation].", example: "I accidentally discovered the best hook formula when I analyzed my flops.", why: "Makes the insight feel serendipitous and authentic." },
  { id: "rule_breaker", category: "personal_experience", name: "The Rule Breaker", template: "I broke every rule about [topic] and here's what happened.", example: "I broke every rule about posting times and here's what happened.", why: "Rebellion is intriguing. People want to see if rules are real." },
  { id: "big_result", category: "personal_experience", name: "The Big Result", template: "I just [achieved impressive thing].", example: "I just sold my company for $10 million.", why: "Immediate credibility. Viewers want to know how." },
  { id: "time_marker", category: "personal_experience", name: "The Time Marker", template: "[Time period] ago I [past state]. Today I [current state].", example: "6 months ago I had 200 followers. Today I have 200,000.", why: "Concrete transformation with a timeline feels achievable." },
  
  // CASE STUDY (9-16)
  { id: "brand_spotlight", category: "case_study", name: "The Brand Spotlight", template: "[Brand/Person] is doing something nobody's talking about.", example: "Adobe is doing something with AI that nobody's talking about.", why: "Name recognition + exclusivity = instant attention." },
  { id: "unexpected_winner", category: "case_study", name: "The Unexpected Winner", template: "This [underdog] is outperforming [expected winner] and here's why.", example: "This unknown creator is outperforming Mr. Beast's engagement and here's why.", why: "David vs Goliath stories are irresistible." },
  { id: "number_flex", category: "case_study", name: "The Number Flex", template: "[Person/Brand] hit [impressive number] by doing [unexpected thing].", example: "This marketer hits 40% conversion rates by ditching landing pages.", why: "Specific numbers create believability and curiosity." },
  { id: "reverse_engineering", category: "case_study", name: "The Reverse Engineering", template: "I studied [successful person] for [time] and found their secret.", example: "I studied Alex Hormozi for 6 months and found his secret.", why: "Positions you as a researcher delivering exclusive insights." },
  { id: "industry_insider", category: "case_study", name: "The Industry Insider", template: "[X]% of [group] are doing [thing] and you're not.", example: "74% of artists are experimenting with AI and you're not.", why: "FOMO + social proof is a powerful combo." },
  { id: "method_reveal", category: "case_study", name: "The Method Reveal", template: "Here's exactly how [person] [achieved result] in [timeframe].", example: "Here's exactly how Brandon Baum creates impossible videos in minutes.", why: "'Exactly how' promises actionable, specific steps." },
  { id: "comparison", category: "case_study", name: "The Comparison", template: "Most [people] get [bad result]. [This person] gets [great result].", example: "Most websites convert at 2-4%. This marketer hits 20-40%.", why: "Gap between normal and exceptional creates desire." },
  { id: "pattern_interrupt", category: "case_study", name: "The Pattern Interrupt", template: "[Famous person/brand] just did something that changes everything.", example: "Forbes just said something about AI that changes everything.", why: "Authority + urgency = must-watch content." },
  
  // SECRET REVEAL (17-26)
  { id: "hidden_truth", category: "secret_reveal", name: "The Hidden Truth", template: "Here's something nobody tells you about [topic].", example: "Here's something nobody tells you about self-respect.", why: "Implies insider knowledge most people miss." },
  { id: "industry_secret", category: "secret_reveal", name: "The Industry Secret", template: "The [industry] doesn't want you to know this.", example: "The algorithm doesn't want you to know this.", why: "Creates an us-vs-them dynamic with viewer on your side." },
  { id: "future_warning", category: "secret_reveal", name: "The Future Warning", template: "What's coming in [timeframe] is going to [big change].", example: "What's coming in 2025 is going to destroy most creators.", why: "Future-pacing creates urgency and fear of missing out." },
  { id: "rate_of_change", category: "secret_reveal", name: "The Rate of Change", template: "The rate at which [thing] is [changing] is actually [emotion].", example: "The rate at which AI is progressing is actually terrifying.", why: "Emotional language + trending topic = engagement." },
  { id: "counterintuitive_truth", category: "secret_reveal", name: "The Counterintuitive Truth", template: "The real reason [thing happens] has nothing to do with [expected reason].", example: "The real reason your content flops has nothing to do with the algorithm.", why: "Challenges assumptions and promises new perspective." },
  { id: "insider_access", category: "secret_reveal", name: "The Insider Access", template: "I have information about [topic] that most people don't.", example: "I have information about where social media is going that most people don't.", why: "Exclusivity is magnetic. People want to be 'in the know.'" },
  { id: "uncomfortable_truth", category: "secret_reveal", name: "The Uncomfortable Truth", template: "No one wants to hear this but [hard truth].", example: "No one wants to hear this but your content isn't the problem.", why: "Frames the message as brave truth-telling." },
  { id: "prediction", category: "secret_reveal", name: "The Prediction", template: "In [timeframe], [current thing] will be [new state].", example: "In 12 months, perfect content will be everywhere and we'll be sick of it.", why: "Predictions feel valuable and shareable." },
  { id: "strategy_reveal", category: "secret_reveal", name: "The Strategy Reveal", template: "Here's how [international/unexpected group] are [achieving result].", example: "Here's how international creators charge US prices.", why: "Geographic/demographic angle adds novelty." },
  { id: "liberation", category: "secret_reveal", name: "The Liberation", template: "Here's the truth that will set you free about [topic].", example: "Here's the truth that will set you free: no one was watching as much as you thought.", why: "Promises emotional relief and breakthrough." },
  
  // CONTRARIAN (27-34)
  { id: "direct_attack", category: "contrarian", name: "The Direct Attack", template: "[Common advice] is ruining your [desired outcome].", example: "Educational content is ruining your sales.", why: "Attacks something they're probably doing. Must defend or learn." },
  { id: "opposite_claim", category: "contrarian", name: "The Opposite Claim", template: "Stop [thing everyone says to do].", example: "Stop posting educational content on Instagram.", why: "Contradicts mainstream advice. Demands explanation." },
  { id: "myth_buster", category: "contrarian", name: "The Myth Buster", template: "Everything you've been told about [topic] is wrong.", example: "Everything you've been told about going viral is wrong.", why: "Promises paradigm shift in understanding." },
  { id: "unpopular_opinion", category: "contrarian", name: "The Unpopular Opinion", template: "Unpopular opinion: [controversial take].", example: "Unpopular opinion: consistency is overrated.", why: "Signals bold thinking. Invites debate and shares." },
  { id: "anti_advice", category: "contrarian", name: "The Anti-Advice", template: "The worst advice I ever got was [common advice].", example: "The worst advice I ever got was 'just be consistent.'", why: "Story format + contrarian angle = compelling combo." },
  { id: "inversion", category: "contrarian", name: "The Inversion", template: "[Desired outcome] doesn't come from [expected source].", example: "Wealth doesn't come from working harder.", why: "Disrupts cause-effect assumptions they hold." },
  { id: "paradox", category: "contrarian", name: "The Paradox", template: "The more you [common action], the less you [desired result].", example: "The more you post, the less you grow.", why: "Paradoxes are mentally sticky and shareable." },
  { id: "industry_lie", category: "contrarian", name: "The Industry Lie", template: "[Industry/gurus] have been lying to you about [topic].", example: "Marketing gurus have been lying to you about funnels.", why: "Positions viewer as victim who needs your truth." },
  
  // QUESTION (35-42)
  { id: "direct_question", category: "question", name: "The Direct Question", template: "Why do most [people] fail at [thing]?", example: "Why do most businesses die from too much, not too little?", why: "Viewer's brain automatically tries to answer." },
  { id: "what_if_question", category: "question", name: "The What If Question", template: "What if [common belief] was actually [opposite]?", example: "What if posting more was actually hurting your growth?", why: "Opens imagination to new possibilities." },
  { id: "choice_question", category: "question", name: "The Choice Question", template: "Would you rather [option A] or [option B]?", example: "Would you rather 10 years of pain for one big exit or mini wins every year?", why: "Forces mental engagement and self-reflection." },
  { id: "identification_question", category: "question", name: "The Identification Question", template: "Do you know what type of [category] you are?", example: "Do you know what type of niche you're in - visual, verbal, or product?", why: "Curiosity about self-categorization is powerful." },
  { id: "problem_question", category: "question", name: "The Problem Question", template: "Ever wonder why [frustrating thing happens]?", example: "Ever wonder why your videos get views but no followers?", why: "Names their pain point directly." },
  { id: "rhetorical_challenge", category: "question", name: "The Rhetorical Challenge", template: "What would happen if you [bold action]?", example: "What would happen if you just stopped caring what people think?", why: "Plants a seed of possibility in their mind." },
  { id: "knowledge_test", category: "question", name: "The Knowledge Test", template: "Can you name [number] [things] that [outcome]?", example: "Can you name 3 substances that permanently change your personality?", why: "Challenges their knowledge. They stay to verify." },
  { id: "stakes_question", category: "question", name: "The Stakes Question", template: "What's the real cost of [common behavior]?", example: "What's the real cost of staying in your hometown?", why: "Forces them to confront consequences they avoid." },
  
  // LIST (43-47)
  { id: "countdown", category: "list", name: "The Countdown", template: "[Number] [things] that will [outcome].", example: "3 substances that can permanently change your personality.", why: "Specific number sets clear expectation. Easy to consume." },
  { id: "daily_tracker", category: "list", name: "The Daily Tracker", template: "Day [number] of [challenge/goal].", example: "Day 29 of building my business in public.", why: "Serialized content creates return viewers." },
  { id: "toolkit", category: "list", name: "The Toolkit", template: "[Number] tools I use to [achieve result].", example: "3 AI tools I use to never run out of content ideas.", why: "Tool lists are highly saveable and shareable." },
  { id: "mistake_list", category: "list", name: "The Mistake List", template: "[Number] mistakes killing your [desired outcome].", example: "5 mistakes killing your engagement right now.", why: "Fear of loss is stronger than desire for gain." },
  { id: "ranking", category: "list", name: "The Ranking", template: "The [number] most [adjective] [things] for [outcome].", example: "The 3 most underrated strategies for going viral.", why: "Rankings promise curated, valuable information." },
  
  // EDUCATION (48-50)
  { id: "how_to", category: "education", name: "The How-To", template: "Here's how to [achieve specific result] in [time/steps].", example: "Here's how to find viral content ideas in under 5 minutes.", why: "Clear promise of transformation with specific outcome." },
  { id: "step_by_step", category: "education", name: "The Step-by-Step", template: "The [number]-step process to [desired outcome].", example: "The 3-step process to never run out of content ideas.", why: "Numbered steps feel organized and achievable." },
  { id: "beginners_guide", category: "education", name: "The Beginner's Guide", template: "If you're new to [topic], here's what you need to know.", example: "If you're new to content creation, here's what you need to know.", why: "Welcomes newcomers and promises foundational knowledge." },
] as const;

// Legacy hook formats (for backwards compatibility)
export const hookFormats = viralHooks.slice(0, 10).map(h => ({
  id: h.id,
  name: h.name,
  template: h.template,
  example: h.example,
}));

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

// Quick Presets with world-class script writer samples
export const quickPresets = [
  { 
    id: "business_growth", 
    name: "Business Growth Engine", 
    description: "High-converting marketing content", 
    category: "business_marketing", 
    hook: "number_flex", 
    structure: "problem_solver", 
    tone: "direct", 
    voice: "confident",
    sampleTopic: "The exact 3-step cold outreach system I used to book 47 sales calls last month without spending a dollar on ads",
    sampleAudience: "Entrepreneurs and business owners struggling to get consistent leads",
    sampleCta: "Drop 'SYSTEM' in the comments and I'll send you my exact templates",
    sampleFacts: "47 calls booked, $0 ad spend, 23% response rate, 6-figure pipeline"
  },
  { 
    id: "ai_tech", 
    name: "AI & Tech Insider", 
    description: "Futuristic and high-energy tech breakdowns", 
    category: "ai_technology", 
    hook: "hidden_truth", 
    structure: "breakdown", 
    tone: "high_energy", 
    voice: "inquisitive",
    sampleTopic: "This new AI feature just dropped and nobody is talking about it. It's going to replace 80% of what most marketers do manually",
    sampleAudience: "Tech-savvy professionals and early adopters who want an edge",
    sampleCta: "Follow for daily AI updates that'll keep you ahead of 99% of people",
    sampleFacts: "Launched this week, free to use, 10x faster than current methods, integrates with everything"
  },
  { 
    id: "viral_growth", 
    name: "Viral Growth Hacks", 
    description: "Fast-paced tips for social growth", 
    category: "social_growth", 
    hook: "countdown", 
    structure: "listicle", 
    tone: "high_energy", 
    voice: "confident",
    sampleTopic: "5 hooks that got me 10M views this month. Number 3 is the one everyone sleeps on",
    sampleAudience: "Content creators who want more views and engagement",
    sampleCta: "Save this and use hook #3 on your next video. Trust me.",
    sampleFacts: "10M+ views, tested on 200+ videos, works on TikTok/Reels/Shorts, takes 5 seconds to add"
  },
  { 
    id: "personal_brand", 
    name: "Authentic Personal Brand", 
    description: "Relatable storytelling to build trust", 
    category: "personal_branding", 
    hook: "unlikely_start", 
    structure: "story_arc", 
    tone: "conversational", 
    voice: "relatable",
    sampleTopic: "I quit my 6-figure job with no backup plan. Here's the uncomfortable truth about what happened next",
    sampleAudience: "People feeling stuck in their careers dreaming of something more",
    sampleCta: "If this resonates, follow for more stories from the journey",
    sampleFacts: "Left corporate 2 years ago, first 6 months were brutal, now earning 3x my old salary, working 20 hours less"
  },
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
