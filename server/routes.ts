import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import multer from "multer";
import { setupAuth, isAuthenticated, setupPasswordReset } from "./auth.js";
import { extractTextFromFile, truncateText, SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from "./ocr-utils.js";
import { parseOpenAIError, ERROR_CODES } from "./error-handler.js";
import { setupSSE, createProgressTracker, CancellationToken } from "./streaming.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_MIME_TYPES.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.pdf') ||
        file.originalname.toLowerCase().endsWith('.docx') ||
        file.originalname.toLowerCase().endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});
import {
  scriptCategories,
  viralHooks,
  hookCategories,
  structureFormats,
  toneOptions,
  voiceOptions,
  pacingOptions,
  durationOptions,
  ctaOptions,
  ctaCategories,
  pricingTiers,
  knowledgeBaseTypes,
  contentStrategyCategories,
  videoTypes,
  creatorStyles,
  extendedCreatorStyles,
  allCreatorStyles,
  ctaLibrary,
  funnelStages,
  insertScriptTemplateSchema,
  insertCtaTemplateSchema,
  type ScriptParameters,
  type GeneratedScript,
  type KnowledgeBaseDoc,
} from "../shared/schema.js";
import { getCreatorById, creatorStyles as comprehensiveCreatorStyles } from "../shared/creator-styles.js";
import { scrapeTikTokProfile, scrapeInstagramProfile, analyzeCreatorStyle, searchTikTokByKeyword, extractVideoTranscript, extractVideoFrames, fetchViralExamples, fetchInstagramViralExamples, fetchAP5Insights, VideoCloneData, ExtractedFrame } from "./apify.js";

// Configure OpenAI client - Always use direct OpenAI API
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiBaseURL = 'https://api.openai.com/v1';
const hasOwnOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasReplitAIKey = false; // No longer using Replit AI integration
const isProductionDeployment = !!process.env.REPLIT_DEPLOYMENT;

if (!openaiApiKey) {
  console.error("[OpenAI Config] WARNING: OPENAI_API_KEY not configured! AI features will fail.");
} else {
  console.log("[OpenAI Config] Using direct OpenAI API");
}

// Initialize OpenAI client - use placeholder key if not configured (will fail on actual API calls)
const openai = new OpenAI({
  apiKey: openaiApiKey || 'not-configured',
  baseURL: openaiBaseURL,
});

// Log AI configuration at startup for debugging
console.log("[OpenAI Config] Configuration:", {
  hasApiKey: !!openaiApiKey,
  baseURL: openaiBaseURL,
});

// Words that sound like AI - NEVER use these
const aiWordsToAvoid = [
  // Pretentious corporate speak
  "utilize", "leverage", "unlock", "dive into", "delve", "explore", "crucial",
  "comprehensive", "robust", "streamline", "revolutionize", "elevate", "harness",
  "optimize", "empower", "game-changing", "cutting-edge", "seamless", "actionable",
  "innovative", "paradigm", "synergy", "holistic", "groundbreaking", "transform",
  // Fluffy AI buzzwords
  "journey", "landscape", "realm", "myriad", "plethora", "tapestry", "unpack",
  "pivotal", "navigate", "foster", "cultivate", "embark", "endeavor", "encompasses",
  "facilitates", "enhances", "bolsters", "underscores", "amplify", "catalyst",
  // Overused AI transitions
  "furthermore", "moreover", "in essence", "it's important to note", "at the end of the day",
  "when it comes to", "in terms of", "needless to say", "that being said",
  // Fancy words - use simple alternatives
  "Subsequently", "Additionally", "Consequently", "Nevertheless", "Notwithstanding"
];

// Banned fluffy phrases - CRITICAL for quality
const bannedFluffyPhrases = [
  "In today's world",
  "Have you ever wondered",
  "Let me tell you something",
  "The truth is",
  "Here's the thing",
  "At the end of the day",
  "It's important to remember",
  "What most people don't realize",
  "It's not as complicated as you think",
  "In today's digital age",
  "Let's dive in",
  "Without further ado",
  "So without further ado",
  "Ladies and gentlemen",
  "If you're like most people",
  "You might be wondering",
  "Now, I know what you're thinking",
  "it's not about",
  "not because",
  "the reason is not",
];

type ViralStyleTemplate = {
  id: string;
  name: string;
  bestFor: string[];
  hookBlueprint: string;
  bodyBlueprint: string;
  ctaBlueprint: string;
  rhythm: string;
  tone: string;
};

const viralStyleTemplates: ViralStyleTemplate[] = [
  { id: "hard_truth", name: "Hard Truth", bestFor: ["business_marketing", "personal_branding"], hookBlueprint: "Direct uncomfortable truth in 8-12 words", bodyBlueprint: "Problem -> consequence -> specific fix", ctaBlueprint: "Command + one simple action", rhythm: "short-short-medium", tone: "blunt and direct" },
  { id: "myth_breaker", name: "Myth Breaker", bestFor: ["content_creation", "ai_technology"], hookBlueprint: "Call out one myth with a concrete claim", bodyBlueprint: "What people believe -> why it fails -> what actually works", ctaBlueprint: "Invite comment with stance", rhythm: "medium-short-short", tone: "confident, corrective" },
  { id: "case_study_snap", name: "Case Study Snap", bestFor: ["business_marketing", "wealth_finance"], hookBlueprint: "Lead with a measurable result", bodyBlueprint: "Context -> action -> result -> lesson", ctaBlueprint: "Offer template/checklist next", rhythm: "short-medium-medium", tone: "evidence-first" },
  { id: "founder_confession", name: "Founder Confession", bestFor: ["personal_branding", "mindset_growth"], hookBlueprint: "Vulnerable first line tied to cost", bodyBlueprint: "Confession -> turning point -> repeatable rule", ctaBlueprint: "Ask viewer to reflect or share", rhythm: "medium-medium-short", tone: "honest, reflective" },
  { id: "3_step_playbook", name: "3-Step Playbook", bestFor: ["education", "content_creation", "ai_technology"], hookBlueprint: "Promise a clear result with 3 steps", bodyBlueprint: "Step 1 -> Step 2 -> Step 3 with specifics", ctaBlueprint: "Save/comment to get full framework", rhythm: "short-medium-short", tone: "practical teacher" },
  { id: "anti_hustle", name: "Anti-Hustle", bestFor: ["mindset_growth", "personal_branding"], hookBlueprint: "Challenge hustle advice with tension", bodyBlueprint: "Expose hidden cost -> better path -> proof", ctaBlueprint: "Ask audience to choose old vs new path", rhythm: "short-short-short", tone: "calm contrarian" },
  { id: "tool_stack", name: "Tool Stack", bestFor: ["ai_technology", "content_creation"], hookBlueprint: "Name one tool outcome in one sentence", bodyBlueprint: "Tool 1 use-case -> Tool 2 -> Tool 3 with numbers", ctaBlueprint: "Comment keyword for stack", rhythm: "short-medium-medium", tone: "builder energy" },
  { id: "pain_to_plan", name: "Pain to Plan", bestFor: ["business_marketing", "social_growth"], hookBlueprint: "Name the pain in second person", bodyBlueprint: "Pain diagnosis -> quick plan -> first move today", ctaBlueprint: "Direct action in next 5 minutes", rhythm: "medium-short-short", tone: "coach-like" },
  { id: "data_shock", name: "Data Shock", bestFor: ["health_science", "wealth_finance", "ai_technology"], hookBlueprint: "Open with one surprising stat", bodyBlueprint: "Stat meaning -> implication -> what to do", ctaBlueprint: "Prompt save/share", rhythm: "short-medium-short", tone: "analytical but simple" },
  { id: "faq_smash", name: "FAQ Smash", bestFor: ["education", "business_marketing"], hookBlueprint: "Ask the #1 recurring question", bodyBlueprint: "Quick answer -> nuance -> edge case", ctaBlueprint: "Invite next FAQ", rhythm: "short-medium-medium", tone: "friendly expert" },
  { id: "before_after", name: "Before/After", bestFor: ["social_growth", "niche_optimization"], hookBlueprint: "Before state vs after state in one line", bodyBlueprint: "Before mistakes -> after system", ctaBlueprint: "Ask which stage they are in", rhythm: "short-short-medium", tone: "transformational" },
  { id: "checklist", name: "Checklist", bestFor: ["content_creation", "education"], hookBlueprint: "If this is you, run this checklist", bodyBlueprint: "3-5 checks with pass/fail criteria", ctaBlueprint: "Save this checklist", rhythm: "short-medium-short", tone: "clear and tactical" },
  { id: "creator_breakdown", name: "Creator Breakdown", bestFor: ["social_growth", "content_creation"], hookBlueprint: "Reverse-engineer a winning creator move", bodyBlueprint: "What they did -> why it worked -> how to adapt", ctaBlueprint: "Comment creator to break down next", rhythm: "medium-short-medium", tone: "observer/analyst" },
  { id: "small_audience_big_money", name: "Small Audience, Big Money", bestFor: ["business_marketing", "personal_branding"], hookBlueprint: "Counterintuitive monetization claim", bodyBlueprint: "Audience myth -> monetization model -> practical proof", ctaBlueprint: "Ask for monetization keyword", rhythm: "short-medium-short", tone: "strategic" },
  { id: "mistake_stack", name: "Mistake Stack", bestFor: ["education", "social_growth"], hookBlueprint: "You are making these 3 mistakes", bodyBlueprint: "Mistake 1/2/3 with concrete fixes", ctaBlueprint: "Save and implement today", rhythm: "short-short-short", tone: "high-clarity" },
  { id: "opinion_with_receipts", name: "Opinion With Receipts", bestFor: ["business_marketing", "ai_technology"], hookBlueprint: "Strong opinion in one line", bodyBlueprint: "Claim -> receipts/data -> practical implication", ctaBlueprint: "Invite disagreement in comments", rhythm: "short-medium-medium", tone: "bold but grounded" },
  { id: "framework_naming", name: "Named Framework", bestFor: ["education", "mindset_growth"], hookBlueprint: "Name your framework + result", bodyBlueprint: "Define 3 parts -> apply example", ctaBlueprint: "Offer full framework if requested", rhythm: "medium-medium-short", tone: "teacher/mentor" },
  { id: "quick_story", name: "Quick Story", bestFor: ["personal_branding", "mindset_growth"], hookBlueprint: "One-sentence story setup", bodyBlueprint: "What happened -> lesson -> repeatable move", ctaBlueprint: "Invite similar story replies", rhythm: "medium-short-medium", tone: "human and warm" },
  { id: "execution_gap", name: "Execution Gap", bestFor: ["business_marketing", "content_creation"], hookBlueprint: "Call out knowledge vs execution gap", bodyBlueprint: "Why people stall -> execution protocol", ctaBlueprint: "Ask for accountability action", rhythm: "short-medium-short", tone: "urgent coach" },
  { id: "micro_lesson", name: "Micro Lesson", bestFor: ["education", "health_science"], hookBlueprint: "One sentence promise: learn this in 30 seconds", bodyBlueprint: "Core concept -> one example -> one action", ctaBlueprint: "Follow for next micro lesson", rhythm: "short-short-medium", tone: "crisp explainer" },
  { id: "future_forecast", name: "Future Forecast", bestFor: ["ai_technology", "wealth_finance"], hookBlueprint: "Prediction with timestamp", bodyBlueprint: "What changes -> who wins/loses -> prep plan", ctaBlueprint: "Ask if they want part 2", rhythm: "medium-short-medium", tone: "forward-looking" },
  { id: "belief_shift", name: "Belief Shift", bestFor: ["mindset_growth", "personal_branding"], hookBlueprint: "One belief that changed everything", bodyBlueprint: "Old belief -> new belief -> applied outcome", ctaBlueprint: "Ask what belief they need to drop", rhythm: "medium-medium-short", tone: "reflective authority" },
  { id: "no_fluff_tutorial", name: "No-Fluff Tutorial", bestFor: ["education", "ai_technology"], hookBlueprint: "Do this exact thing in under X minutes", bodyBlueprint: "Step sequence with exact tools/inputs", ctaBlueprint: "Save for implementation", rhythm: "short-medium-short", tone: "operator mode" },
  { id: "niche_voice", name: "Niche Voice", bestFor: ["niche_optimization", "social_growth"], hookBlueprint: "Speak directly to a specific niche identity", bodyBlueprint: "Niche pain -> niche fix -> niche proof", ctaBlueprint: "CTA with niche keyword", rhythm: "short-short-medium", tone: "high relevance" },
  { id: "objection_crusher", name: "Objection Crusher", bestFor: ["business_marketing", "wealth_finance"], hookBlueprint: "Name the #1 objection out loud", bodyBlueprint: "Objection -> reframe -> evidence -> low-risk next step", ctaBlueprint: "Invite DM/comment trigger", rhythm: "medium-short-short", tone: "sales clarity" },
  { id: "status_play", name: "Status Play", bestFor: ["personal_branding", "business_marketing"], hookBlueprint: "Call out status behavior and its cost", bodyBlueprint: "Status trap -> better signal -> practical move", ctaBlueprint: "Ask audience to commit publicly", rhythm: "short-medium-short", tone: "sharp and social" },
  { id: "community_angle", name: "Community Angle", bestFor: ["personal_branding", "social_growth"], hookBlueprint: "You don't need more content, you need more community", bodyBlueprint: "Audience problem -> community mechanism -> example", ctaBlueprint: "Invite conversation starter", rhythm: "medium-short-medium", tone: "human-centered" },
  { id: "experiment_log", name: "Experiment Log", bestFor: ["ai_technology", "content_creation"], hookBlueprint: "I tested X for Y days", bodyBlueprint: "Hypothesis -> method -> result -> takeaway", ctaBlueprint: "Ask what to test next", rhythm: "short-medium-medium", tone: "builder lab" },
  { id: "one_move_today", name: "One Move Today", bestFor: ["education", "mindset_growth"], hookBlueprint: "If you do one thing today, do this", bodyBlueprint: "Why this move matters now -> exact execution", ctaBlueprint: "Prompt immediate action comment", rhythm: "short-short-short", tone: "decisive" },
];

// Helper function to check for fluff in script
function containsFluff(script: string): boolean {
  const lowerScript = script.toLowerCase();
  if (bannedFluffyPhrases.some(phrase => lowerScript.includes(phrase.toLowerCase()))) {
    return true;
  }

  const repetitiveRhetoricPatterns = [
    /it\s+isn't\s+about\s+.+?\s+it\s+is\s+about/gi,
    /it's\s+not\s+about\s+.+?\s+it's\s+about/gi,
    /not\s+because\s+.+?\s+but\s+because/gi,
    /not\s+this\s+but\s+that/gi,
  ];

  return repetitiveRhetoricPatterns.some((pattern) => pattern.test(script));
}

// Helper function to check for actionability
function isActionable(script: string): { actionable: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const lowerScript = script.toLowerCase();
  
  // Check for specific numbers
  const hasNumbers = /\d+/.test(script);
  if (!hasNumbers) reasons.push("No specific numbers or stats");
  
  // Check for vague advice patterns
  const vaguePatterns = [
    "think about your",
    "consider your",
    "keep in mind",
    "remember that",
    "it's about",
    "value is key",
    "be consistent",
    "work harder",
    "try harder",
  ];
  const hasVague = vaguePatterns.some(p => lowerScript.includes(p));
  if (hasVague) reasons.push("Contains vague advice");
  
  // Check for weak CTAs
  const weakCtas = [
    "let me know what you think",
    "let me know your thoughts",
    "comment below",
    "what do you think",
    "share your thoughts",
  ];
  const hasWeakCta = weakCtas.some(c => lowerScript.includes(c));
  if (hasWeakCta) reasons.push("Weak CTA");
  
  return { actionable: reasons.length === 0, reasons };
}

// Script Memory: Style analysis cache (15 min TTL)
const styleCache = new Map<string, { summary: string; timestamp: number }>();
const STYLE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface StyleAnalysis {
  summary: string;
  hasHistory: boolean;
  scriptCount: number;
}

// Analyze user's past scripts to extract style patterns for continuity
function analyzeUserStyle(scripts: Array<{ script: string; parameters: any; title: string }>): StyleAnalysis {
  if (!scripts || scripts.length === 0) {
    return { summary: "", hasHistory: false, scriptCount: 0 };
  }

  // Extract patterns from scripts
  const tones: string[] = [];
  const hookStyles: string[] = [];
  const ctaVerbs: string[] = [];
  const signaturePhrases: string[] = [];
  const structureTypes: string[] = [];

  scripts.forEach(s => {
    const params = s.parameters as any;
    if (params?.tone) tones.push(params.tone);
    if (params?.hook) hookStyles.push(params.hook);
    if (params?.structure) structureTypes.push(params.structure);
    
    // Extract CTA verbs from script content
    const ctaMatch = s.script?.match(/(?:Follow|Subscribe|Save|Comment|Share|DM|Click|Check out|Grab|Download|Join|Watch|Try)/gi);
    if (ctaMatch) ctaVerbs.push(...ctaMatch.slice(0, 2));
    
    // Extract opening patterns (first 50 chars)
    const opening = s.script?.substring(0, 80).trim();
    if (opening) signaturePhrases.push(opening);
  });

  // Count frequencies
  const countFrequency = (arr: string[]) => {
    const counts: Record<string, number> = {};
    arr.forEach(item => {
      const key = item.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([item]) => item);
  };

  const topTones = countFrequency(tones);
  const topHooks = countFrequency(hookStyles);
  const topCtas = countFrequency(ctaVerbs);
  const topStructures = countFrequency(structureTypes);

  // Build concise style summary (max ~300 tokens)
  let summary = `\n== CREATOR STYLE MEMORY (Based on ${scripts.length} past scripts) ==\n`;
  
  if (topTones.length > 0) {
    summary += `Preferred tone: ${topTones.join(", ")}\n`;
  }
  if (topHooks.length > 0) {
    summary += `Favorite hook styles: ${topHooks.join(", ")}\n`;
  }
  if (topStructures.length > 0) {
    summary += `Common structures: ${topStructures.join(", ")}\n`;
  }
  if (topCtas.length > 0) {
    summary += `CTA patterns: ${topCtas.join(", ")}\n`;
  }
  
  // Sample opening styles (show 2 examples max)
  if (signaturePhrases.length > 0) {
    summary += `\nOpening style examples from past work:\n`;
    signaturePhrases.slice(0, 2).forEach((phrase, i) => {
      summary += `${i + 1}. "${phrase.substring(0, 60)}..."\n`;
    });
  }
  
  summary += `\nMaintain voice consistency with this creator's established style while keeping content fresh.\n`;
  summary += `== END STYLE MEMORY ==\n`;

  return { summary, hasHistory: true, scriptCount: scripts.length };
}

// Get cached or compute style analysis
async function getCachedStyleAnalysis(userId: string, getScripts: () => Promise<any[]>): Promise<StyleAnalysis> {
  const cached = styleCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < STYLE_CACHE_TTL) {
    return { summary: cached.summary, hasHistory: true, scriptCount: 0 };
  }
  
  const scripts = await getScripts();
  const analysis = analyzeUserStyle(scripts.map(s => ({
    script: s.script,
    parameters: s.parameters,
    title: s.title
  })));
  
  if (analysis.hasHistory) {
    styleCache.set(userId, { summary: analysis.summary, timestamp: now });
  }
  
  return analysis;
}

function generateScript(params: ScriptParameters): GeneratedScript {
  const category = scriptCategories.find((c) => c.id === params.category);
  const hook = viralHooks.find((h) => h.id === params.hook);
  const structure = structureFormats.find((s) => s.id === params.structure);
  const duration = durationOptions.find((d) => d.id === params.duration);

  const hookLine = hook?.example || "Here's something you need to know.";
  const topic = params.topic?.toLowerCase() || "this";
  const cta = params.callToAction || "Follow for more.";
  
  // Scripts written in punchy style: short sentences, one idea per line
  const sampleScripts: Record<string, string> = {
    problem_solver: `${hookLine}

It was killing me.

Every single day.

Nothing worked.

Here's the real problem.

Most people do it wrong.

They overcomplicate things.

${topic !== "this" ? `When it comes to ${topic}, it's simpler.` : "But it's simpler than you think."}

Here's what actually works.

First, understand the core issue.

Then take action.

Stop overthinking.

Just start.

${cta}`,

    breakdown: `${hookLine}

Let me break this down.

There's three parts.

One. The foundation.

${topic !== "this" ? `With ${topic}, you start here.` : "You start with the basics."}

This is non-negotiable.

Two. The execution.

This is where most fail.

They skip this step.

Don't.

Three. The results.

Put it together.

Watch what happens.

${cta}`,

    listicle: `${hookLine}

3 things that change everything.

Number one.

${topic !== "this" ? `Focus on ${topic} first.` : "Focus on what matters."}

This alone is worth the watch.

Number two.

Stay consistent.

Even when it's hard.

Results come from repetition.

Number three.

Track your progress.

Weekly.

What gets measured gets fixed.

${cta}`,

    tutorial: `${hookLine}

Takes 2 minutes.

Step one.

${topic !== "this" ? `Open ${topic}.` : "Pull this up."}

Step two.

Make this change.

Click here. Then here.

Step three.

See the result.

That's it.

Done.

Simple.

${cta}`,

    story_arc: `${hookLine}

A year ago I was stuck.

Nothing worked.

Tried everything.

Then something changed.

${topic !== "this" ? `I found a different approach to ${topic}.` : "I found something different."}

Wasn't easy.

But I kept going.

Now? Everything's different.

Here's what I learned.

The struggle was necessary.

It taught me what matters.

You got this.

${cta}`,

    educational_motivation: `${hookLine}

I used to think I knew everything.

Life humbled me.

${topic !== "this" ? `${params.topic} taught me something.` : "This taught me something unexpected."}

The lesson was simple.

More powerful than I expected.

Here's what changed.

Stop chasing perfect.

Start embracing progress.

You're already on the path.

Keep going.

${cta}`,
  };

  const scriptContent = sampleScripts[params.structure] || sampleScripts.problem_solver;
  const words = scriptContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  const avgWordsPerSentence = words.length / (scriptContent.split(/[.!?]+/).length - 1);
  const gradeLevel = Math.max(3, Math.min(12, 0.39 * avgWordsPerSentence + 4));

  const productionNotes = `Film close-up, direct to camera. Start with energy on the hook. Natural pauses between key points. ${params.platform === "tiktok" ? "Keep cuts fast and dynamic." : "Match the pace to your audience."}`;

  const bRollIdeas = [
    `Screen recording of ${topic || "app/tool"} in action`,
    `Close-up hands typing or demonstrating`,
    `Before/after comparison graphics`,
    `Text overlay animations for key stats`,
    `Reaction shots or nodding moments`,
  ];

  const onScreenText = [
    hookLine.slice(0, 40) + "...",
    `The ${topic?.split(" ").slice(0, 3).join(" ") || "Key"} Method`,
    params.callToAction?.slice(0, 25) || "Follow for more",
  ];

  const cameraAngles = [
    "Talking head - center frame, eye level",
    "Slight angle left/right for variety",
    "Close-up for emotional moments",
    "Wide shot for context/setup",
  ];

  const transitions = [
    "Jump cut between sentences",
    "Zoom punch on key words",
    "Swipe transition for new sections",
    "Flash frame for emphasis",
  ];

  const musicMood = params.tone === "high_energy" 
    ? "Upbeat, driving electronic - 120+ BPM. Think motivational workout energy."
    : params.tone === "vulnerable"
    ? "Soft ambient piano - emotional and reflective. Keep it subtle."
    : "Modern lo-fi or chill beat - 80-100 BPM. Not distracting.";

  const captionStyle = params.platform === "tiktok"
    ? "Bold, centered captions with 3-4 words max per line. Yellow/white with black outline. Animate key words."
    : params.platform === "instagram"
    ? "Clean white captions, minimal animation. Consider adding branded colors."
    : "Standard auto-captions. Ensure accuracy before posting.";

  const pacing = params.duration === "30" 
    ? "Fast and punchy - no pauses longer than 0.5s between lines"
    : params.duration === "60"
    ? "Medium pace - let key points breathe for 1s"
    : "Conversational pace - can include natural pauses for emphasis";

  const lighting = "Ring light or soft box at 45-degree angle. Fill light optional. Avoid harsh shadows.";

  const scriptLines = scriptContent.split("\n\n").filter(Boolean);
  const totalDuration = parseInt(params.duration) || 60;
  const perScene = Math.floor(totalDuration / Math.max(scriptLines.length, 4));
  const fallbackWordTargets: Record<string, { min: number; max: number }> = {
    "15": { min: 38, max: 50 },
    "30": { min: 80, max: 100 },
    "60": { min: 160, max: 200 },
    "90": { min: 240, max: 300 },
    "180": { min: 480, max: 600 },
  };
  const fallbackTarget = fallbackWordTargets[params.duration || "60"] || fallbackWordTargets["60"];
  
  const scenes = [
    {
      section: "Hook",
      lines: hookLine,
      duration: `0:00 - 0:0${Math.min(perScene, 5)}`,
      camera: "Center frame, slight zoom in",
      energy: "HIGH - grab attention immediately"
    },
    {
      section: "Setup",
      lines: scriptLines.slice(1, 3).join(" "),
      duration: `0:0${perScene} - 0:${perScene * 2}`,
      camera: "Angle left or right",
      energy: "Building - establish context"
    },
    {
      section: "Core Content",
      lines: scriptLines.slice(3, 6).join(" "),
      duration: `0:${perScene * 2} - 0:${perScene * 4}`,
      camera: "Mix of angles + B-roll cuts",
      energy: "Medium-high - deliver value"
    },
    {
      section: "Call to Action",
      lines: cta,
      duration: `0:${Math.max(totalDuration - 5, perScene * 4)} - 0:${totalDuration}`,
      camera: "Center frame, direct to camera",
      energy: "Warm - personal connection"
    }
  ];

  return {
    id: randomUUID(),
    script: scriptContent,
    wordCount,
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    productionNotes,
    bRollIdeas,
    onScreenText,
    cameraAngles,
    transitions,
    musicMood,
    captionStyle,
    pacing,
    lighting,
    scenes,
    parameters: params,
    createdAt: new Date(),
    qualityReport: {
      overallScore: 70,
      durationMatchScore: 70,
      styleMatchScore: 65,
      coherenceScore: 75,
      ctaScore: 85,
      topicRelevanceScore: 80,
      targetSeconds: parseInt(params.duration || "60") || 60,
      estimatedSeconds: Math.round((wordCount / 172) * 60),
      targetWordMin: fallbackTarget.min,
      targetWordMax: fallbackTarget.max,
      actualWords: wordCount,
    },
  };
}

function buildKnowledgeBaseContext(docs: KnowledgeBaseDoc[]): string {
  if (!docs.length) return "";
  
  const sections: string[] = [];
  
  const icpDocs = docs.filter(d => d.type === "icp");
  if (icpDocs.length) {
    sections.push(`## IDEAL CUSTOMER PROFILE (ICP)
${icpDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const brandDocs = docs.filter(d => d.type === "brand_positioning");
  if (brandDocs.length) {
    sections.push(`## BRAND POSITIONING
${brandDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const messagingDocs = docs.filter(d => d.type === "messaging_house");
  if (messagingDocs.length) {
    sections.push(`## MESSAGING PILLARS
${messagingDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const voiceDocs = docs.filter(d => d.type === "voice_dna");
  if (voiceDocs.length) {
    sections.push(`## VOICE & TONE DNA
${voiceDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const ruleDocs = docs.filter(d => d.type === "rule_of_one");
  if (ruleDocs.length) {
    sections.push(`## RULE OF ONE (Avatar, Problem, Solution)
${ruleDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const businessDocs = docs.filter(d => d.type === "business_box");
  if (businessDocs.length) {
    sections.push(`## BUSINESS CONTEXT
${businessDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const strategyDocs = docs.filter(d => d.type === "content_strategy");
  if (strategyDocs.length) {
    sections.push(`## CONTENT STRATEGY
${strategyDocs.map(d => d.content).join("\n\n")}`);
  }
  
  const customDocs = docs.filter(d => d.type === "custom");
  if (customDocs.length) {
    sections.push(`## ADDITIONAL CONTEXT
${customDocs.map(d => `${d.title}:\n${d.content}`).join("\n\n")}`);
  }
  
  return sections.join("\n\n---\n\n");
}

async function generateScriptWithAI(params: ScriptParameters, knowledgeBaseDocs?: KnowledgeBaseDoc[], creatorStyleMemory?: string): Promise<GeneratedScript> {
  const hook = viralHooks.find((h) => h.id === params.hook);
  const structure = structureFormats.find((s) => s.id === params.structure);
  const duration = durationOptions.find((d) => d.id === params.duration);
  const tone = toneOptions.find((t) => t.id === params.tone);
  const voice = voiceOptions.find((v) => v.id === params.voice);
  const videoType = videoTypes.find((vt) => vt.id === params.videoType) || videoTypes[0];
  
  // Look up creator style from allCreatorStyles (combined list), then legacy list as fallback
  const foundCreator = allCreatorStyles.find((cs) => cs.id === params.creatorStyle);
  const legacyCreator = creatorStyles.find((cs) => cs.id === params.creatorStyle);
  const creatorStyle = foundCreator 
    ? { id: foundCreator.id, name: foundCreator.name, description: foundCreator.tone, characteristics: foundCreator.tone, exampleHook: foundCreator.exampleHook }
    : legacyCreator || creatorStyles[0];

  const explicitTemplate = params.templateStyleId
    ? viralStyleTemplates.find((template) => template.id === params.templateStyleId)
    : undefined;
  const categoryTemplatePool = viralStyleTemplates.filter((template) => template.bestFor.includes(params.category));
  const randomizedTemplatePool = categoryTemplatePool.length > 0 ? categoryTemplatePool : viralStyleTemplates;
  const autoTemplate = params.diversifyStyle === false
    ? undefined
    : randomizedTemplatePool[Math.floor(Math.random() * randomizedTemplatePool.length)];
  const selectedStyleTemplate = explicitTemplate || autoTemplate;
  
  const selectedCta = params.selectedCtaId 
    ? ctaOptions.find(c => c.id === params.selectedCtaId)?.text 
    : null;
  const finalCta = params.customCta || selectedCta || params.callToAction || "Follow for more.";

  // Word targets based on ~2.5-3 words per second speaking rate for short-form video
  // Targeting the UPPER range to fill the full duration
  const wordTargets: Record<string, { min: number; max: number }> = {
    "15": { min: 38, max: 50 },      // ~2.5-3.3 words/sec
    "30": { min: 80, max: 100 },     // ~2.7-3.3 words/sec  
    "60": { min: 160, max: 200 },    // ~2.7-3.3 words/sec
    "90": { min: 240, max: 300 },    // ~2.7-3.3 words/sec
    "180": { min: 480, max: 600 },   // ~2.7-3.3 words/sec
  };
  const targetWords = wordTargets[params.duration] || wordTargets["60"];

  let researchContext = "";
  let referenceAnalysis = "";
  let voiceReferenceAnalysis = "";
  const kbContext = knowledgeBaseDocs ? buildKnowledgeBaseContext(knowledgeBaseDocs) : "";
  
  const researchSections: string[] = [];
  const shouldRunGeneralResearch = !!params.deepResearch;
  const shouldRunSocialResearch = !!(params.deepResearch || params.includeCompetitorResearch);

  if (shouldRunGeneralResearch) {
    try {
      const researchResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a factual short-form content researcher.

Return concise research in plain text with these sections:
STATS:
- 3 to 5 specific data points with source names
EXPERT INSIGHTS:
- 2 to 3 expert quotes or paraphrased positions with source names
CONTRARIAN ANGLES:
- 1 to 2 sharp takes that challenge default advice
REAL EXAMPLES:
- 2 concrete case studies or examples
COMMON MISTAKES:
- 3 mistakes people make on this topic

Rules:
- Prefer real, widely known facts over speculation
- If uncertain, say "source needs verification"
- Keep every bullet useful for writing a better short-form script`
          },
          {
            role: "user",
            content: `Research this topic for a short-form video script: "${params.topic}"
${params.targetAudience ? `Target audience: ${params.targetAudience}` : ""}
${params.keyFacts ? `Known facts to include: ${params.keyFacts}` : ""}`
          }
        ],
        max_tokens: 900,
        temperature: 0.4,
      });
      const generalResearch = researchResponse.choices[0]?.message?.content?.trim();
      if (generalResearch) {
        researchSections.push(`GENERAL RESEARCH\n${generalResearch}`);
      }
    } catch (error) {
      console.error("General research failed, continuing without it:", error);
    }
  }

  if (shouldRunSocialResearch && process.env.APIFY_API_TOKEN) {
    try {
      const [tiktokExamplesResult, instagramExamplesResult, strategicInsightsResult] = await Promise.allSettled([
        fetchViralExamples(params.topic, 5),
        fetchInstagramViralExamples(params.topic, 5),
        fetchAP5Insights(params.topic, { platforms: ["tiktok", "instagram"], limit: 12 }),
      ]);

      if (tiktokExamplesResult.status === "fulfilled" && tiktokExamplesResult.value.examples.length > 0) {
        const tiktokExamples = tiktokExamplesResult.value;
        researchSections.push(`TIKTOK WINNERS\n${tiktokExamples.examples.slice(0, 4).map((example) => `- Hook: "${example.hookLine}" | ${Math.round(example.views / 1000)}K views | ${example.engagementRate}% engagement | Format: ${example.formatType}`).join("\n")}\nTop TikTok formats: ${tiktokExamples.dominantFormats.join(", ") || "unknown"}\nTop TikTok hook types: ${tiktokExamples.dominantHookTypes.join(", ") || "unknown"}`);
      }

      if (instagramExamplesResult.status === "fulfilled" && instagramExamplesResult.value.examples.length > 0) {
        const instagramExamples = instagramExamplesResult.value;
        researchSections.push(`INSTAGRAM WINNERS\n${instagramExamples.examples.slice(0, 4).map((example) => `- Hook: "${example.hookLine}" | ${Math.round(example.views / 1000)}K plays/likes | ${example.engagementRate}% engagement | Format: ${example.formatType}`).join("\n")}\nTop Instagram formats: ${instagramExamples.dominantFormats.join(", ") || "unknown"}\nTop Instagram hook types: ${instagramExamples.dominantHookTypes.join(", ") || "unknown"}`);
      }

      if (strategicInsightsResult.status === "fulfilled") {
        const insights = strategicInsightsResult.value;
        const strategicLines = [
          insights.topicSummary ? `Summary: ${insights.topicSummary}` : "",
          insights.keyInsights.length > 0 ? `Key insights:\n${insights.keyInsights.slice(0, 5).map((item) => `- ${item}`).join("\n")}` : "",
          insights.painPoints.length > 0 ? `Audience pain points:\n${insights.painPoints.slice(0, 4).map((item) => `- ${item}`).join("\n")}` : "",
          insights.emotionalDrivers.length > 0 ? `Emotional drivers:\n${insights.emotionalDrivers.slice(0, 4).map((item) => `- ${item}`).join("\n")}` : "",
          insights.provenCTAIdeas.length > 0 ? `Proven CTA ideas:\n${insights.provenCTAIdeas.slice(0, 3).map((item) => `- ${item}`).join("\n")}` : "",
          insights.swipeableFacts.length > 0 ? `Swipeable facts:\n${insights.swipeableFacts.slice(0, 4).map((item) => `- ${item}`).join("\n")}` : "",
        ].filter(Boolean).join("\n");

        if (strategicLines) {
          researchSections.push(`SOCIAL STRATEGIC INSIGHTS\n${strategicLines}`);
        }
      }
    } catch (error) {
      console.error("Social research failed, continuing without it:", error);
    }
  }

  researchContext = researchSections.join("\n\n");

  // Analyze reference script if provided
  if (params.referenceScript && params.referenceScript.trim().length > 50) {
    try {
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a viral script analyst. Analyze the given reference script and extract:
1. Hook Type: What type of hook is used (e.g., personal experience, contrarian, question, etc.)
2. Structure: What structure does it follow (problem-solution, listicle, story arc, etc.)
3. Tone: What tone does it use (direct, conversational, high-energy, vulnerable, etc.)
4. Pacing: What is the pacing (rapid-fire, balanced, deliberate)
5. Sentence Length: Average words per sentence
6. Unique Patterns: Any catchphrases, transition styles, or repeated patterns
7. CTA Style: How does it close/call to action

Be concise. Format as a brief analysis that can guide script generation.`
          },
          {
            role: "user",
            content: `Analyze this viral script:\n\n${params.referenceScript.slice(0, 3000)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.5,
      });
      referenceAnalysis = analysisResponse.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Reference analysis failed, continuing without:", error);
    }
  }

  if (params.voiceReferenceScript && params.voiceReferenceScript.trim().length > 50) {
    try {
      const voiceAnalysisResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a creator voice analyst. Analyze the script and extract the creator's natural voice so a future script can sound like the same person.
Focus on:
1. Sentence rhythm and pacing
2. Vocabulary simplicity/complexity
3. Tone and confidence level
4. Common transitions or phrasing patterns
5. How the creator opens and closes ideas

Return a concise style analysis for a ghostwriter.`
          },
          {
            role: "user",
            content: `Analyze this winning script voice:\n\n${params.voiceReferenceScript.slice(0, 3000)}`
          }
        ],
        max_tokens: 400,
        temperature: 0.4,
      });
      voiceReferenceAnalysis = voiceAnalysisResponse.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Voice reference analysis failed, continuing without:", error);
    }
  }

  const knowledgeBaseInstructions = kbContext ? `
=== CREATOR'S KNOWLEDGE BASE - USE THIS CONTENT ===
${kbContext}
=== END KNOWLEDGE BASE ===

CRITICAL - HOW TO USE THE KNOWLEDGE BASE ABOVE:
1. VOICE: Write EXACTLY like the creator speaks. Copy their phrases, rhythm, and style.
2. PAIN POINTS: Use the specific problems/fears mentioned for their audience.
3. WORDS: Use their terminology, not generic business words.
4. EXAMPLES: Pull from their case studies or examples when relevant.
5. SOUND LIKE THEM: A fan should recognize this as their content.

DO NOT write generic content. ONLY use ideas from the knowledge base.
` : "";

  // Build video type specific instructions
  const videoTypeInstructions: Record<string, string> = {
    talking_head: `Format: Write a script for someone speaking directly to camera. Just the spoken words, one line per sentence.`,
    broll_voiceover: `Format: Write voiceover text with shot descriptions. Format each segment as:
[SHOT: Description of b-roll footage]
VO: "Voiceover text here"

Include a SHOT LIST at the end with numbered shots and durations.`,
    text_on_screen: `Format: Write text cards that appear on screen (no voice). Format as:
[CARD 1 - X sec]
"Text that appears"
[Suggested visual: description]

Include MUSIC SUGGESTION and TOTAL DURATION at the end.`,
    ai_avatar: `Format: Write for an AI avatar/clone with expression cues. Format as:
[EXPRESSION: Description of expression/emotion]
"Spoken text here"

Include AVATAR NOTES at the end about energy and delivery.`,
    screen_recording: `Format: Write voiceover for screen recording tutorial. Format as:
VO: "Voiceover text"
[SCREEN: Description of what appears on screen]

Be specific about click actions and visual elements.`,
    mixed_format: `Format: Write a mixed format script with different segments. Use labels:
[TALKING HEAD] - for direct to camera
[B-ROLL] with VO: - for footage with voiceover  
[TEXT ON SCREEN] - for text cards
Include transitions between formats.`,
  };

  // Build creator style instructions - use comprehensive master prompts when available
  let creatorStyleInstructions = "";
  if (creatorStyle.id !== "default") {
    const comprehensiveCreator = getCreatorById(creatorStyle.id);
    if (comprehensiveCreator) {
      creatorStyleInstructions = `
CREATOR STYLE - USE THIS MASTER PROMPT:
${comprehensiveCreator.masterPrompt}

SIGNATURE PHRASES TO USE:
${comprehensiveCreator.signaturePhrases.slice(0, 3).map(p => `- "${p}"`).join('\n')}

HOOK PATTERNS:
${comprehensiveCreator.hookPatterns.slice(0, 2).map(h => `- ${h.name}: "${h.template}"`).join('\n')}
`;
    } else {
      creatorStyleInstructions = `
CREATOR STYLE - MATCH THIS EXACTLY:
Style: ${creatorStyle.name}
Characteristics: ${creatorStyle.characteristics}
Example Hook: "${creatorStyle.exampleHook}"

Match this creator's:
- Hook patterns and opening style
- Sentence length and vocabulary level
- Energy and tone throughout
- Common phrases and transitions
- How they close/call to action
`;
    }
  }

  const styleTemplateInstructions = !params.clonedVideoStructure && selectedStyleTemplate ? `
ROTATING VIRAL STYLE TEMPLATE (FOLLOW THIS STYLE DNA):
- Template: ${selectedStyleTemplate.name}
- Hook blueprint: ${selectedStyleTemplate.hookBlueprint}
- Body blueprint: ${selectedStyleTemplate.bodyBlueprint}
- CTA blueprint: ${selectedStyleTemplate.ctaBlueprint}
- Rhythm: ${selectedStyleTemplate.rhythm}
- Tone: ${selectedStyleTemplate.tone}

Execution rules:
1. Use this as the primary structural style for this script.
2. Keep it sounding conversational and spoken, not written.
3. Vary wording naturally; do not repeat rhetorical formulas.
4. Avoid binary cliché patterns like "not X, but Y" and "it's not about X, it's about Y".
` : "";

  // Reference script instructions
  const referenceInstructions = referenceAnalysis ? `
REFERENCE SCRIPT ANALYSIS - MATCH THIS STYLE:
${referenceAnalysis}

Generate a NEW script about the user's topic that follows these same patterns but with original content.
` : "";

  const voiceReferenceInstructions = voiceReferenceAnalysis ? `
LOCKED WINNER VOICE - USE THIS AS THE BASELINE STYLE:
${voiceReferenceAnalysis}

This is the user's chosen winning variant. Match its rhythm, phrasing, and voice confidence so the next script feels like it came from the same creator brain.
` : "";

  // Cloned video structure instructions
  let clonedStructureInstructions = "";
  if (params.clonedVideoStructure) {
    const clone = params.clonedVideoStructure as any;
    clonedStructureInstructions = `

######################################################################
# FORMAT CLONE MODE — STRUCTURE IS LAW, ONLY THE TOPIC CHANGES       #
######################################################################

You are ghostwriting a video script that must feel like it was made by the SAME creator as the original. A viewer who watched both videos should think: "This is definitely the same person's style." The structure, rhythm, emotional arc, transitions, and psychology must be near-identical. Only the TOPIC changes.

## ORIGINAL VIDEO DNA

**Format:** ${clone.format?.replace(/_/g, " ") || "unknown"}
${clone.audienceProfile ? `**Audience:** ${clone.audienceProfile}` : ''}
${clone.estimatedDurationSeconds ? `**Estimated Duration:** ${clone.estimatedDurationSeconds}s` : ''} ${clone.wordCount ? `| **Word Count Target:** ${clone.wordCount} (±15%)` : ''}
${clone.wordsPerMinute ? `**Words Per Minute:** ${clone.wordsPerMinute}` : ''}

## VOICE & TONE

${clone.toneProfile ? `- **Energy:** ${clone.toneProfile.energy || 'Not specified'}
- **Vocabulary:** ${clone.toneProfile.vocabulary || 'Not specified'}
- **Attitude:** ${clone.toneProfile.attitude || 'Not specified'}
- **Personality:** ${clone.toneProfile.personality || 'Not specified'}` : `- **Tone:** ${clone.toneDescription || 'Conversational'}`}

${clone.emotionalArc ? `## EMOTIONAL ARC TO REPLICATE
${clone.emotionalArc}
↑ Your script must follow this SAME emotional journey. Each section should hit the same emotional beat as the original.` : ''}

## HOOK (replicate this EXACT psychology)
${clone.hookAnalysis ? `- **Trigger:** ${clone.hookAnalysis.psychologyTrigger || 'Not specified'}
- **Style:** ${clone.hookAnalysis.style || clone.hookStyle || 'Not specified'}
- **Template:** "${clone.hookAnalysis.template || ''}"
- **Original line:** "${clone.hookAnalysis.openingLine || ''}" ← Write YOUR version targeting the same psychological trigger` : `- **Style:** ${clone.hookStyle?.replace(/_/g, " ") || "unknown"}
${clone.hookTemplate ? `- **Template:** "${clone.hookTemplate}"` : ''}`}

${clone.sections?.length > 0 ? `## SECTION-BY-SECTION BLUEPRINT
Replicate this EXACT structure. Do not add, remove, or reorder sections.

${clone.sections.map((s: any, i: number) => `### ${i + 1}. ${s.name} (${s.durationPercent}% | ~${s.sentenceCount || '2-3'} sentences${s.avgWordsPerSentence ? ` | ~${s.avgWordsPerSentence} words/sentence` : ''})
${s.purpose ? `**Purpose:** ${s.purpose}` : ''}
${s.emotionalTone ? `**Emotional tone:** ${s.emotionalTone}` : ''}
**Description:** ${s.description}
${s.exampleLines?.length > 0 ? `**Original lines:** "${s.exampleLines.join('" | "')}" ← Write YOUR version matching this style, length, and tone` : s.exampleLine ? `**Original line:** "${s.exampleLine}" ← Write YOUR version matching this style` : ''}`).join('\n\n')}` : ''}

${clone.bodyTemplate ? `## BODY STRUCTURE TEMPLATE
${clone.bodyTemplate}
↑ Follow this flow exactly. If the original presents problem→wrong solution→right solution, you do the same. If it stacks 3 examples, you stack 3 examples.` : ''}

## CTA (replicate this exact approach)
${clone.ctaAnalysis ? `- **Style:** ${clone.ctaAnalysis.style || clone.ctaStyle || 'soft ask'}
- **Template:** "${clone.ctaAnalysis.template || ''}"
- **Original:** "${clone.ctaAnalysis.exactLine || ''}" ← Adapt to new topic, keep same structure` : `- **Style:** ${clone.ctaStyle?.replace(/_/g, " ") || "soft ask"}
${clone.ctaTemplate ? `- **Template:** "${clone.ctaTemplate}"` : ''}`}

${(clone.transitionPhrases && clone.transitionPhrases.length > 0) ? `## TRANSITION PHRASES TO MIRROR
Use similar phrases adapted to the new topic:
${clone.transitionPhrases.map((p: string) => `- "${p}"`).join('\n')}` : ''}

## SENTENCE STYLE RULES
${clone.sentenceStructure?.dominantType ? `- **Dominant type:** ${clone.sentenceStructure.dominantType}
- **Average length:** ${clone.sentenceStructure.avgLength || 'varies'} words per sentence
- **Rhythm pattern:** ${clone.sentenceStructure.pattern || 'varies'}` : clone.sentenceStructure ? `${clone.sentenceStructure}` : ''}
${clone.pacing?.overall ? `- **Pacing:** ${clone.pacing.overall}
- **Cadence:** ${clone.pacing.sentenceRhythm || 'Not specified'}
- **Pauses:** ${clone.pacing.pausePattern || 'Not specified'}` : ''}

${clone.powerWords?.length > 0 ? `## POWER WORDS & VOCABULARY
Use equivalents of these for the new topic: ${clone.powerWords.join(', ')}` : ''}

${clone.retentionMechanics?.length > 0 ? `## RETENTION MECHANICS TO REPLICATE
${clone.retentionMechanics.map((m: string) => `- ${m}`).join('\n')}` : ''}

${clone.uniqueStyleNotes ? `## DISTINCTIVE STYLE ELEMENTS
${clone.uniqueStyleNotes}` : ''}

${clone.visualCues?.length > 0 ? `## VISUAL/EDITING NOTES
${clone.visualCues.map((v: string) => `- ${v}`).join('\n')}` : ''}

${clone.frames?.length > 0 ? `## VIDEO FRAME ANALYSIS
The original video has ${clone.frames.length} key frames extracted at these timestamps:
${clone.frames.map((f: any, i: number) => `- Frame ${i + 1}: ${f.timestamp}s`).join('\n')}
Use these visual reference points to generate PRODUCTION NOTES for each section of the cloned script.` : ''}

${clone.originalTranscript ? `## REFERENCE TRANSCRIPT
Study the rhythm, word choice, and flow — then write your script as a sibling:
"${clone.originalTranscript.slice(0, 1500)}${clone.originalTranscript.length > 1500 ? '...' : ''}"` : ''}

######################################################################
# CLONE QUALITY RULES — VIOLATING ANY = FAILED CLONE                 #
######################################################################
1. EXACT same number of sections as the original
2. Match sentence count per section (±1 sentence)
3. Match total word count within 15%
4. Mirror the hook psychology — same trigger type, not just same format
5. Use adapted transition phrases in the SAME positions as the original
6. Follow the SAME emotional arc — each section hits the same emotional beat
7. Match sentence rhythm: if original uses short-short-long, you use short-short-long
8. Mirror CTA structure and positioning exactly
9. Replicate retention mechanics — if original uses open loops, you use open loops
10. DO NOT flatten into generic Hook/Body/CTA — use the ORIGINAL section names and structure
11. DO NOT add motivational filler, generic advice, or padding not present in the original style
12. The new topic fills the template. The TEMPLATE comes from the cloned video. Template is law.

## OUTPUT FORMAT
Return the script with clear section labels matching the original's structure. Include:
- [SECTION NAME] headers matching the blueprint above
- Any visual/text overlay suggestions in [VISUAL: ...] brackets
- Total word count at the end

After the script, add a "--- PRODUCTION NOTES ---" section with practical filming/editing guidance based on the original video's visual style:
- Camera setup (e.g., "Direct to camera, waist-up framing", "Screen recording with voiceover")
- Text overlay suggestions for key moments (what text, when it appears, style)
- B-roll or visual cut suggestions tied to specific script sections
- Pacing/editing notes (e.g., "Jump cut every 3-4 seconds", "Hold on face for emphasis during hook")
- Audio/music direction (e.g., "Trending audio underneath", "Clean audio, no music")
- Lighting and setting suggestions based on the content type
Keep production notes concise and actionable — each note should be something the creator can directly implement.
######################################################################
`;
  }

  // Clone mode and duration settings must be defined before prompt construction.
  const isCloneMode = !!params.clonedVideoStructure;
  const cloneWordCount = isCloneMode ? (params.clonedVideoStructure as any)?.wordCount : null;
  const cloneDuration = isCloneMode ? (params.clonedVideoStructure as any)?.estimatedDurationSeconds : null;
  const cloneWordsPerMinute = isCloneMode ? (params.clonedVideoStructure as any)?.wordsPerMinute : null;
  const effectiveDuration = cloneDuration || params.duration;
  const effectiveWordTarget = cloneWordCount
    ? { min: Math.round(cloneWordCount * 0.85), max: Math.round(cloneWordCount * 1.15) }
    : targetWords;

  const systemPrompt = `You are a world-class short-form video scriptwriter who writes like a real human, NOT an AI.
${clonedStructureInstructions}
${creatorStyleInstructions ? `
=== CREATOR STYLE EMULATION (HIGHEST PRIORITY) ===
${creatorStyleInstructions}
You MUST emulate this creator's exact style, including their signature phrases, hook patterns, sentence structure, and energy. This takes precedence over general rules below when there's a conflict.
=== END CREATOR STYLE ===
` : ''}
${styleTemplateInstructions ? `
=== TEMPLATE STYLE ROTATION ===
${styleTemplateInstructions}
=== END TEMPLATE STYLE ===
` : ""}
CRITICAL RULES - FOLLOW EXACTLY:
1. TOPIC RELEVANCE (MOST IMPORTANT): Your script MUST be 100% about the EXACT topic provided. Every sentence must directly relate to the topic. Do NOT go off on tangents. Do NOT write about something else. If the topic is "How to get leads from LinkedIn" - EVERY sentence must be about LinkedIn lead generation.

${isCloneMode ? `2. VOICE & STYLE: Match the cloned video's EXACT tone, vocabulary level, and speaking style from the FORMAT CLONE DNA above. Do NOT impose a different reading level or style — the original video's voice IS the target voice.
3. SOUND LIKE THE ORIGINAL CREATOR: Your script should read as if the same person wrote it. Match their energy, sentence structure, vocabulary, and personality exactly.` : `2. READING LEVEL: Grade 3-6 reading level. Use simple, everyday words. Short sentences. No jargon.
3. SOUND HUMAN: Write like you're texting a friend. Use contractions. Be casual. No corporate speak.`}
4. CTA: You MUST use the EXACT CTA provided by the user. Copy it word-for-word. Do NOT create your own CTA.
5. ONE IDEA PER SENTENCE: Never combine multiple thoughts in one sentence.
6. BANNED WORDS - NEVER USE: ${aiWordsToAvoid.join(", ")}
7. BANNED RHETORIC PATTERNS - NEVER USE:
  - "It's not about X, it's about Y"
  - "Not because X, but because Y"
  - "The reason is not X. It's Y"

${isCloneMode ? `<output_quality_rules>
CLONE MODE QUALITY RULES:

1. STRUCTURAL FIDELITY — Your script MUST have the EXACT same number of sections, in the EXACT same order, with matching sentence counts (±1) per section. This is non-negotiable.

2. VOICE MATCH — Read the tone profile, energy level, vocabulary level, and personality from the FORMAT CLONE DNA. Your script must sound like the SAME creator wrote it. If the original is high-energy and uses slang, yours must too. If the original is calm and professional, match that.

3. RHYTHM MATCH — Mirror the sentence rhythm pattern. If the original uses "short-short-long" sentences, you do too. If it uses fragments followed by a full sentence, you do too. Count the beats.

4. HOOK PSYCHOLOGY — Your hook must trigger the SAME psychological response as the original (curiosity gap, identity challenge, controversy, etc.) — not just use the same format.

5. CONTENT DEPTH — Each section must have REAL substance about the new topic. Don't pad with generic filler. Provide specific examples, numbers, frameworks, or insights that match the depth of the original.

6. TRANSITION FIDELITY — Use adapted versions of the original's transition phrases in the SAME positions. If the original says "But here's what nobody tells you" between sections 2 and 3, you use a similar transition there.

7. EMOTIONAL ARC — Follow the same emotional journey. If the original goes Shock→Empathy→Authority→Hope, your script hits those same emotional beats in the same order.
</output_quality_rules>

<quality_check>
Before outputting, verify your clone against:
- Structure match (Same section count, same order, same proportions?)
- Voice match (Would a viewer think the same person wrote both?)
- Rhythm match (Sentence lengths and patterns mirror the original?)
- Hook psychology match (Same trigger type, adapted to new topic?)
- Content depth (Real substance, not generic filler?)
- Word count (Within 15% of original?)

If any of these fail, rewrite before showing.
</quality_check>` : `<output_quality_rules>
EVERY SCRIPT MUST:

1. BE ACTIONABLE
- Every script must give the viewer ONE clear thing they can do immediately after watching
- No vague advice like "think about your goals" or "consider your options"
- Instead: Specific steps like "Open your phone. Go to Settings. Turn off notifications for 2 hours."

2. HAVE CONCRETE SPECIFICS
- Include specific numbers, timeframes, or examples
- BAD: "Post more content"
- GOOD: "Post 3 times per day for 30 days"
- MUST include at least 2 specific numbers/stats in every script
- MUST mention specific platforms, tools, or methods by name

3. BAN GENERIC PLACEHOLDER WORDS - NEVER USE:
- "someone", "a client", "people", "they", "others" (be specific - name a type of person)
- "results", "success", "growth" without numbers (say "47% increase" not "great results")
- "some", "many", "most", "few" (use actual numbers)
- "things", "stuff", "something" (be specific)
- "recently", "soon", "sometimes" (use exact timeframes)

4. AVOID FLUFF PHRASES (unless part of creator style signature):
- "In today's world..."
- "Have you ever wondered..."
- "At the end of the day..."
- "It's important to remember..."

5. GET TO THE POINT
- Hook in first 2 seconds (first sentence)
- Main value by second 3-5
- No long intros or build-ups
- Every sentence must earn its place

6. END WITH CLEAR NEXT STEP
- Tell them exactly what to do next
- Make it doable in under 5 minutes
- Be specific: "Comment 'GUIDE' below" not "Let me know what you think"
</output_quality_rules>

<quality_check>
Before outputting any script, internally grade it 1-10 on:
- Actionability (Can viewer do something specific after watching?)
- Specificity (Are there concrete numbers, steps, examples?)
- Fluff-free (No wasted sentences or vague phrases?)
- Hook strength (Does first sentence demand attention?)
- Clear CTA (Is the next step obvious?)

If total score is below 35/50, rewrite the script before showing.
</quality_check>`}

Style guidelines:
- One short sentence per line
- Include specific numbers and examples when available
- Create tension, curiosity, or emotional connection
- Use pattern interrupts to maintain attention

VIDEO TYPE: ${videoType.name}
${videoTypeInstructions[videoType.id] || videoTypeInstructions.talking_head}

${videoType.id === "talking_head" && !params.clonedVideoStructure ? `IMPORTANT: Structure your script with EXACTLY these three sections:

**HOOK**
(First 3 seconds - must stop the scroll. One powerful opening line.)

**BODY**
(The main content - insights, steps, revelations. Keep it punchy and valuable.)

**CTA**
(Call to action - what you want them to do next.)

Use these exact labels.` : ""}

Do NOT include hashtags unless specified. Separate each line with a blank line for clarity.
${referenceInstructions}
${voiceReferenceInstructions}`;

  // Build skeleton context if provided (supports both legacy contentSkeleton and new videoIdeaSkeleton)
  let skeletonContext = "";
  
  // Video purpose context for script generation
  const videoPurposeGuidance: Record<string, string> = {
    authority: "This is an AUTHORITY video. The creator is positioning themselves as an expert. The tone should be confident and opinionated. Lead with the bold insight.",
    education: "This is an EDUCATION video. The creator is teaching something valuable. The core teaching is the main event - explain it thoroughly with steps, examples, or proof points.",
    storytelling: "This is a STORYTELLING video. The creator is sharing a personal experience. The core teaching is the lesson learned - weave it naturally through the narrative.",
  };
  
  // New VideoIdeaSkeleton format from IdeaClarifier
  if (params.videoIdeaSkeleton) {
    const skeleton = params.videoIdeaSkeleton;
    const purposeGuide = skeleton.videoPurpose ? videoPurposeGuidance[skeleton.videoPurpose] || "" : "";
    
    skeletonContext = `
=== LOCKED VIDEO IDEA SKELETON - FOLLOW THIS STRUCTURE EXACTLY ===
This skeleton has been carefully refined by the user. Follow it precisely.
${purposeGuide ? `\nVIDEO PURPOSE: ${skeleton.videoPurpose?.toUpperCase()}\n${purposeGuide}` : ""}

**HOOK** (First 3 seconds - must stop the scroll. SPEAK it, don't read it.)
${skeleton.hook}

**PROBLEM** (The pain point - mention it briefly to set up the teaching)
USER'S PROBLEM CONTEXT:
${skeleton.problem}

**CORE TEACHING / SOLUTION** (THIS IS THE HEART OF THE SCRIPT)
USER'S SOLUTION CONTEXT:
${skeleton.solution}

=== CRITICAL INSTRUCTIONS FOR SCRIPT GENERATION ===

1. RESEARCH & VALIDATE: Before writing, mentally verify if the problem and solution points are accurate and valid. If you know relevant stats, studies, or expert opinions that support or enhance these points, incorporate them.

2. DO NOT COPY EXACT WORDS: The problem and solution context above is RAW INPUT from the user. You must NOT copy their exact wording. Instead:
   - REPHRASE everything in a natural, conversational spoken voice
   - Use different vocabulary while keeping the same meaning
   - Make it sound like YOU (the creator) are naturally explaining this
   - Transform written notes into spoken dialogue
   
3. CONVERSATIONAL STYLE: Write as if speaking to a friend:
   - "Look, here's what nobody tells you about..."
   - "The thing is..."
   - "And here's the crazy part..."
   - NOT formal or written-sounding language
   
4. ENHANCE WITH RESEARCH: Add value by including:
   - Specific statistics or numbers if you know them
   - Real-world examples or case studies
   - Expert quotes or research findings
   - Contrarian angles or surprising facts

5. CORE TEACHING IS THE STAR: Spend 60-70% of the script body on this section:
   - EXPAND on it: Explain WHY it works, HOW to do it
   - PROVE it with examples, stats, or logic
   - Do NOT just mention it briefly and move on
   - Every sentence in the body should connect back to this core teaching

6. AVOID COPY-PASTE TRAP: The user has given you context to work from, NOT a script to recite. Transform their raw ideas into polished, viral-ready content.

**CTA** (Call to action - what you want them to do)
${skeleton.cta}

TARGET AUDIENCE: ${skeleton.targetAudience || "Content creators and entrepreneurs"}

STRUCTURE: Hook → Brief Problem → CORE TEACHING (most of the video) → CTA
=== END VIDEO IDEA SKELETON ===
`;
  }
  // Legacy contentSkeleton format (still supported for advanced mode)
  else if (params.contentSkeleton) {
    const skeleton = params.contentSkeleton;
    skeletonContext = `
=== LOCKED CONTENT SKELETON - FOLLOW THIS STRUCTURE EXACTLY ===
Topic Summary: ${skeleton.topicSummary}
Unique Angle: ${skeleton.uniqueAngle}

SECTIONS TO COVER (in this order):
${skeleton.sections.map((s: any, i: number) => `
${i + 1}. ${s.title} (${s.suggestedDuration})
   Objective: ${s.objective}
   Key Moments:
${s.keyMoments.map((m: string) => `   - ${m}`).join('\n')}
`).join('')}

${skeleton.researchFacts && skeleton.researchFacts.length > 0 ? `
RESEARCH FACTS TO INCLUDE:
${skeleton.researchFacts.map((f: any) => `- ${f.fact}${f.source ? ` (${f.source})` : ''}`).join('\n')}
` : ''}

${skeleton.suggestedHooks && skeleton.suggestedHooks.length > 0 ? `
SUGGESTED HOOK ANGLES:
${skeleton.suggestedHooks.map((h: string) => `- "${h}"`).join('\n')}
` : ''}
=== END CONTENT SKELETON ===
`;
  }

  const userPrompt = isCloneMode 
    ? `Write a script about the topic below using the FORMAT CLONE instructions from the system prompt. The cloned video's structure, rhythm, and style are LAW — only the topic changes.

${knowledgeBaseInstructions}
${creatorStyleMemory || ''}
=== YOUR TOPIC ===
${params.topic}
=== END TOPIC ===

${params.referenceScript ? `=== USER'S CONTENT NOTES FOR EACH SECTION ===
The creator provided these notes for what they want in each section. Use this content as the foundation for each section — it tells you what SPECIFIC points to cover:

${params.referenceScript}

Weave these notes into the cloned structure naturally. The notes tell you WHAT to say; the clone blueprint tells you HOW to say it.
=== END CONTENT NOTES ===` : ''}

${skeletonContext}

TARGET WORD COUNT: ${effectiveWordTarget.min}-${effectiveWordTarget.max} words (match the original video's length)
${effectiveDuration ? `TARGET DURATION: ~${effectiveDuration} seconds` : ''}
${cloneWordsPerMinute ? `TARGET SPEAKING PACE: ~${cloneWordsPerMinute} words per minute` : 'TARGET SPEAKING PACE: ~165-180 words per minute'}
PLATFORM: ${params.platform}
${params.targetAudience ? `TARGET AUDIENCE: ${params.targetAudience}` : ""}
${params.keyFacts ? `KEY FACTS TO INCLUDE: ${params.keyFacts}` : ""}

=== MANDATORY CTA - USE EXACTLY AS WRITTEN ===
"${finalCta}"
=== END CTA ===

You MUST end the script with the EXACT CTA above. Copy it word-for-word. Do NOT change it, improve it, or write your own.

${researchContext ? `=== RESEARCH DATA — INCORPORATE INTO YOUR SCRIPT ===
${researchContext}

Weave at least 2 stats or facts from this research naturally into the relevant sections.
=== END RESEARCH DATA ===` : ""}

=== WRITING INSTRUCTIONS ===
1. Follow the FORMAT CLONE blueprint section by section
2. Use [SECTION NAME] headers matching the blueprint's section names exactly
3. Write each line as its own paragraph (one sentence per line)
4. Match the original video's sentence count per section (±1 sentence)
5. Match the original video's sentence lengths, rhythm, and energy
6. Your script should feel like a SIBLING of the original — same creator, different topic
7. Include [VISUAL: ...] notes where the original had visual elements
8. After the script, add "--- PRODUCTION NOTES ---" with practical filming/editing guidance

Write the full script now.`

    : `Write a FULL ${params.duration}-second video script. You MUST write ${targetWords.min}-${targetWords.max} words to fill the entire duration. DO NOT write a shorter script - the viewer needs content for the FULL ${params.duration} seconds.

${knowledgeBaseInstructions}
${creatorStyleMemory || ''}
=== YOUR TOPIC - STAY 100% ON THIS ===
${params.topic}
=== EVERY SENTENCE MUST BE ABOUT THIS EXACT TOPIC ===
${skeletonContext}

VIDEO TYPE: ${videoType.name} - ${videoType.description}
${creatorStyle.id !== "default" ? `
=== EMULATE THIS CREATOR'S STYLE EXACTLY ===
CREATOR: ${creatorStyle.name}
STYLE: ${creatorStyle.description}
- Use their signature phrases and hook patterns
- Match their sentence structure and energy level
- Sound like THEM speaking, not generic content
===` : ""}
HOOK STYLE: ${hook?.name || "The Painful Past"} - "${hook?.template || "I used to [painful thing everyone relates to]."}"
STRUCTURE: ${structure?.name || "Problem Solver"} - ${structure?.description || "Present problem, then solution"}
TONE: ${tone?.name || "High Energy"}
VOICE: ${voice?.name || "Confident"}
PLATFORM: ${params.platform}
TARGET SPEAKING PACE: ~165-180 words per minute
${params.contentStrategy ? `CONTENT CATEGORY: ${params.contentStrategy} (consider this funnel stage when writing)` : ""}
${params.targetAudience ? `TARGET AUDIENCE: ${params.targetAudience}` : ""}
${params.keyFacts ? `KEY FACTS TO INCLUDE: ${params.keyFacts}` : ""}

=== MANDATORY CTA - USE EXACTLY AS WRITTEN ===
"${finalCta}"
=== END CTA ===

You MUST end the script with the EXACT CTA above. Copy it word-for-word. Do NOT change it, improve it, or write your own.

${researchContext ? `=== MANDATORY RESEARCH DATA - YOU MUST USE THESE ===
${researchContext}

YOU MUST incorporate at least 2 stats or facts from this research into your script.
Do NOT ignore this research. Use specific numbers, percentages, and data points.
=== END RESEARCH DATA ===` : ""}

Write the script now. Use grade 3 reading level (simple words, short sentences). Make each line its own paragraph.
${videoType.id !== "talking_head" ? `Remember to use the ${videoType.name} format with proper labels and structure.` : ""}`;

  // Helper function to calculate grade level
  const calculateGradeLevel = (text: string): number => {
    const words = text.split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
    return Math.max(3, Math.min(12, 0.39 * avgWordsPerSentence + 4));
  };

  const estimateDurationSeconds = (wordCount: number, wordsPerMinute?: number): number => {
    const wpm = wordsPerMinute && wordsPerMinute > 0 ? wordsPerMinute : 172;
    return Math.round((wordCount / wpm) * 60);
  };

  type StyleFingerprint = {
    avgWordsPerSentence: number;
    questionRatio: number;
    exclamationRatio: number;
    shortSentenceRatio: number;
    firstPersonRatio: number;
  };

  const getStyleFingerprint = (text: string): StyleFingerprint => {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const sentenceChunks = text
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean);
    const sentences = sentenceChunks.length > 0 ? sentenceChunks : text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

    const sentenceWordCounts = sentences.map(s => s.split(/\s+/).filter(Boolean).length).filter(n => n > 0);
    const avgWordsPerSentence = sentenceWordCounts.length
      ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
      : 0;

    const questionCount = (text.match(/\?/g) || []).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    const shortSentenceCount = sentenceWordCounts.filter(n => n <= 7).length;
    const firstPersonCount = (text.match(/\b(i|i'm|i’ve|ive|my|me|we|our|us)\b/gi) || []).length;

    return {
      avgWordsPerSentence,
      questionRatio: sentences.length ? questionCount / sentences.length : 0,
      exclamationRatio: sentences.length ? exclamationCount / sentences.length : 0,
      shortSentenceRatio: sentenceWordCounts.length ? shortSentenceCount / sentenceWordCounts.length : 0,
      firstPersonRatio: words.length ? firstPersonCount / words.length : 0,
    };
  };

  const styleMatchScore = (reference: string, candidate: string): number => {
    if (!reference?.trim() || !candidate?.trim()) return 100;
    const a = getStyleFingerprint(reference);
    const b = getStyleFingerprint(candidate);

    const sentenceLenDelta = Math.abs(a.avgWordsPerSentence - b.avgWordsPerSentence);
    const questionDelta = Math.abs(a.questionRatio - b.questionRatio);
    const exclamationDelta = Math.abs(a.exclamationRatio - b.exclamationRatio);
    const shortSentenceDelta = Math.abs(a.shortSentenceRatio - b.shortSentenceRatio);
    const firstPersonDelta = Math.abs(a.firstPersonRatio - b.firstPersonRatio);

    const penalty =
      Math.min(35, sentenceLenDelta * 3.5) +
      Math.min(20, questionDelta * 100) +
      Math.min(15, exclamationDelta * 100) +
      Math.min(15, shortSentenceDelta * 100) +
      Math.min(15, firstPersonDelta * 300);

    return Math.max(0, Math.round(100 - penalty));
  };
  
  // Helper function to check if CTA is present in script
  const ctaIsPresent = (script: string, cta: string): boolean => {
    // Normalize both for comparison (lowercase, remove extra spaces)
    const normalizedScript = script.toLowerCase().trim();
    const normalizedCta = cta.toLowerCase().trim();
    // Check if script ends with CTA or contains it in the last portion
    const lastPortion = normalizedScript.slice(-300);
    return lastPortion.includes(normalizedCta) || 
           lastPortion.includes(normalizedCta.replace(/[.,!?]/g, ''));
  };
  
  // Helper function to check specificity (numbers, percentages, specific data)
  const hasSpecificData = (script: string): { specific: boolean; numberCount: number; genericWords: string[] } => {
    // Count specific numbers/percentages in the script
    const numberMatches = script.match(/\d+(\.\d+)?(%|x|times|days|hours|minutes|seconds|weeks|months|years)?/gi) || [];
    const numberCount = numberMatches.length;
    
    // Check for generic placeholder words
    const genericPatterns = [
      /\bsomeone\b/gi, /\ba client\b/gi, /\bsome people\b/gi,
      /\bmany people\b/gi, /\bmost people\b/gi,
      /\bgreat results\b/gi, /\bamazing results\b/gi,
      /\bsome things\b/gi, /\bstuff\b/gi,
      /\brecently\b/gi, /\bsoon\b/gi
    ];
    
    const foundGenerics: string[] = [];
    for (const pattern of genericPatterns) {
      const matches = script.match(pattern);
      if (matches) foundGenerics.push(...matches);
    }
    
    // Need at least 2 numbers and no more than 2 generic words
    const specific = numberCount >= 2 && foundGenerics.length <= 2;
    return { specific, numberCount, genericWords: foundGenerics };
  };

  // Helper function to check topic relevance
  const isTopicRelevant = (script: string, topic: string): { relevant: boolean; matchedKeywords: number; totalKeywords: number } => {
    const normalizedScript = script.toLowerCase();
    // Extract meaningful keywords from topic (ignore common words)
    const stopWords = new Set(['how', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'of', 'and', 'or', 'is', 'are', 'be', 'with', 'from', 'your', 'you', 'i', 'my', 'at', 'by']);
    const topicKeywords = topic.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/[^a-z]/g, ''));
    
    // Check how many topic keywords appear in the script
    const matchedKeywords = topicKeywords.filter(keyword => 
      keyword.length > 0 && normalizedScript.includes(keyword)
    ).length;
    
    // At least 50% of topic keywords should appear in the script
    const relevanceThreshold = 0.5;
    const relevant = topicKeywords.length === 0 || (matchedKeywords / topicKeywords.length) >= relevanceThreshold;
    
    return { relevant, matchedKeywords, totalKeywords: topicKeywords.length };
  };

  try {
    let scriptContent = "";
    let attempts = 0;
    const maxAttempts = 3;
    let gradeLevel = 10; // Start high to trigger validation
    let ctaValid = false;
    let hasFluff = true;
    let actionabilityCheck = { actionable: false, reasons: ["Not checked yet"] };
    let topicRelevance = { relevant: false, matchedKeywords: 0, totalKeywords: 1 };
    let specificityCheck = { specific: false, numberCount: 0, genericWords: [] as string[] };
    let wordCountValid = false;
    let currentWordCount = 0;
    let durationValid = false;
    let estimatedSeconds = 0;
    let styleMatch = 100;
    const referenceStyleSource = isCloneMode
      ? ((params.clonedVideoStructure as any)?.originalTranscript || "")
      : (params.voiceReferenceScript || params.referenceScript || "");
    const enforceStyleMatch = referenceStyleSource.trim().length > 30 || isCloneMode;
    const targetDurationSeconds = Number(effectiveDuration) || Number(params.duration) || 60;
    const minStyleScore = isCloneMode ? 72 : 60;
    
    // Retry loop for quality validation
    // Clone mode: only retry for word count, CTA, and topic — don't enforce grade level, fluff, specificity, or actionability
    // since the cloned video's style may legitimately differ from our generic quality rules
    const needsRetry = () => isCloneMode
      ? (!ctaValid || !wordCountValid || !topicRelevance.relevant || !durationValid || (enforceStyleMatch && styleMatch < minStyleScore))
      : (gradeLevel > 5 || !ctaValid || hasFluff || !actionabilityCheck.actionable || !topicRelevance.relevant || !specificityCheck.specific || !wordCountValid || !durationValid || (enforceStyleMatch && styleMatch < minStyleScore));
    while (attempts < maxAttempts && needsRetry()) {
      attempts++;
      const temperature = attempts === 1 ? 0.8 : 0.6; // Lower temperature on retries
      
      // Build specific retry hints based on what failed
      let retryHints: string[] = [];
      if (attempts > 1) {
        if (!wordCountValid) {
          if (currentWordCount < effectiveWordTarget.min) {
            retryHints.push(`SCRIPT IS TOO SHORT! You wrote ${currentWordCount} words but need ${effectiveWordTarget.min}-${effectiveWordTarget.max} words. ADD MORE CONTENT.`);
          } else if (currentWordCount > effectiveWordTarget.max) {
            retryHints.push(`SCRIPT IS TOO LONG! You wrote ${currentWordCount} words but need only ${effectiveWordTarget.min}-${effectiveWordTarget.max} words. CUT IT DOWN.`);
          }
        }
        if (!topicRelevance.relevant) retryHints.push(`STAY ON TOPIC! Your script must be about "${params.topic}". Every sentence must relate to this topic. You only matched ${topicRelevance.matchedKeywords}/${topicRelevance.totalKeywords} topic keywords.`);
        if (!durationValid) retryHints.push(`DURATION MISMATCH: Estimated ${estimatedSeconds}s vs target ~${targetDurationSeconds}s. Tighten or expand lines so spoken runtime matches.`);
        if (enforceStyleMatch && styleMatch < minStyleScore) retryHints.push(`STYLE MISMATCH: Your style match score is ${styleMatch}/100 (need ${minStyleScore}+). Match sentence rhythm, punctuation energy, and POV to the reference video.`);
        if (!isCloneMode) {
          if (!specificityCheck.specific) {
            const issues: string[] = [];
            if (specificityCheck.numberCount < 2) issues.push(`ADD MORE SPECIFIC NUMBERS! You only have ${specificityCheck.numberCount} - need at least 2 stats/percentages/timeframes.`);
            if (specificityCheck.genericWords.length > 2) issues.push(`REMOVE GENERIC WORDS: ${specificityCheck.genericWords.slice(0, 3).join(', ')}. Replace with specific names, numbers, or examples.`);
            retryHints.push(issues.join(' '));
          }
          if (gradeLevel > 5) retryHints.push('USE SIMPLER WORDS AND SHORTER SENTENCES.');
          if (hasFluff) retryHints.push('REMOVE ALL FLUFFY PHRASES. Get straight to the point. No "In today\'s world" or "The truth is".');
          if (!actionabilityCheck.actionable) {
            retryHints.push(`MAKE IT MORE ACTIONABLE: ${actionabilityCheck.reasons.join(', ')}. Include specific numbers, timeframes, and clear next steps.`);
          }
        }
        if (!ctaValid) retryHints.push('USE THE EXACT CTA PROVIDED - COPY IT WORD FOR WORD.');
      }
      
      const retryHint = retryHints.length > 0 
        ? `\n\nPREVIOUS ATTEMPT FAILED QUALITY CHECK:\n${retryHints.join('\n')}\n\nRewrite with these fixes.`
        : '';
      
      const response = await openai.chat.completions.create({
        model: isCloneMode ? "gpt-4o" : "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt + retryHint }
        ],
        max_tokens: isCloneMode ? 3000 : 1500,
        temperature: isCloneMode ? 0.7 : temperature,
      });

      scriptContent = response.choices[0]?.message?.content || "";
      gradeLevel = calculateGradeLevel(scriptContent);
      ctaValid = ctaIsPresent(scriptContent, finalCta);
      hasFluff = containsFluff(scriptContent);
      actionabilityCheck = isActionable(scriptContent);
      topicRelevance = isTopicRelevant(scriptContent, params.topic || "");
      specificityCheck = hasSpecificData(scriptContent);
      
      // Word count validation
      const scriptWords = scriptContent.split(/\s+/).filter(Boolean);
      currentWordCount = scriptWords.length;
      wordCountValid = currentWordCount >= effectiveWordTarget.min && currentWordCount <= effectiveWordTarget.max;
      estimatedSeconds = estimateDurationSeconds(currentWordCount, cloneWordsPerMinute || undefined);
      const durationTolerance = isCloneMode ? 0.1 : 0.15;
      const minDuration = Math.floor(targetDurationSeconds * (1 - durationTolerance));
      const maxDuration = Math.ceil(targetDurationSeconds * (1 + durationTolerance));
      durationValid = estimatedSeconds >= minDuration && estimatedSeconds <= maxDuration;
      styleMatch = styleMatchScore(referenceStyleSource, scriptContent);
      
      console.log(`Script generation attempt ${attempts}: words=${currentWordCount} (target ${effectiveWordTarget.min}-${effectiveWordTarget.max}), estDuration=${estimatedSeconds}s (~${targetDurationSeconds}s), styleMatch=${styleMatch}/100, grade=${gradeLevel.toFixed(1)}, ctaValid=${ctaValid}, hasFluff=${hasFluff}, actionable=${actionabilityCheck.actionable}, topicRelevant=${topicRelevance.relevant} (${topicRelevance.matchedKeywords}/${topicRelevance.totalKeywords}), specific=${specificityCheck.specific} (${specificityCheck.numberCount} numbers, ${specificityCheck.genericWords.length} generic words)`);
    }
    
    // If we still failed validation after max attempts, log warning but continue
    if (!wordCountValid) {
      console.warn(`Word count validation failed: ${currentWordCount} words (target ${targetWords.min}-${targetWords.max}) after ${maxAttempts} attempts`);
    }
    if (!durationValid) {
      console.warn(`Duration validation failed: estimated ${estimatedSeconds}s (target ~${targetDurationSeconds}s) after ${maxAttempts} attempts`);
    }
    if (enforceStyleMatch && styleMatch < minStyleScore) {
      console.warn(`Style match validation failed: ${styleMatch}/100 (required ${minStyleScore}+) after ${maxAttempts} attempts`);
    }
    if (gradeLevel > 5) {
      console.warn(`Script grade level ${gradeLevel.toFixed(1)} exceeds target (max 5) after ${maxAttempts} attempts`);
    }
    if (!ctaValid) {
      console.warn(`CTA validation failed after ${maxAttempts} attempts. Expected: "${finalCta}"`);
    }
    if (hasFluff) {
      console.warn(`Script still contains fluffy phrases after ${maxAttempts} attempts`);
    }
    if (!actionabilityCheck.actionable) {
      console.warn(`Script actionability issues: ${actionabilityCheck.reasons.join(', ')}`);
    }
    if (!topicRelevance.relevant) {
      console.warn(`Script topic relevance failed: only ${topicRelevance.matchedKeywords}/${topicRelevance.totalKeywords} keywords matched for topic "${params.topic}"`);
    }
    if (!specificityCheck.specific) {
      console.warn(`Script specificity failed: ${specificityCheck.numberCount} numbers found (need 2+), generic words: ${specificityCheck.genericWords.join(', ')}`);
    }
    
    // COHERENCE VALIDATION - Check if script is logically connected, not random facts stitched together
    // Skip for clone mode - cloned scripts follow the original video's structure, not hook→problem→solution→CTA
    let coherenceCheck = { coherent: isCloneMode ? true : false, issues: [] as string[], suggestions: [] as string[] };
    let coherenceScore = isCloneMode ? 100 : 65;
    let coherenceAttempts = 0;
    const maxCoherenceAttempts = isCloneMode ? 0 : 2;
    
    while (coherenceAttempts < maxCoherenceAttempts && !coherenceCheck.coherent) {
      coherenceAttempts++;
      
      try {
        const coherenceResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a script coherence validator. Your job is to check if a video script tells a COHERENT STORY with logical flow, not just random facts stitched together.

A COHERENT script:
1. Has a clear narrative thread connecting hook → problem → solution → CTA
2. Each sentence builds on the previous one
3. The solution directly addresses the problem stated
4. Facts/stats support the core teaching, not distract from it
5. The CTA naturally follows from the teaching

An INCOHERENT script:
1. Jumps between unrelated ideas
2. Has facts that don't connect to the main teaching
3. The solution doesn't match the problem
4. Feels like random tips pasted together
5. Has logical non-sequiturs

Respond in JSON ONLY:
{
  "coherent": true/false,
  "score": 1-10 (10 = perfectly coherent narrative),
  "issues": ["issue 1", "issue 2"] (empty if coherent),
  "suggestions": ["suggestion 1"] (empty if coherent)
}`
            },
            {
              role: "user",
              content: `Validate this script for coherence and logical flow:

TOPIC: ${params.topic}
${params.videoIdeaSkeleton ? `
INTENDED PROBLEM: ${params.videoIdeaSkeleton.problem?.slice(0, 300)}
INTENDED SOLUTION: ${params.videoIdeaSkeleton.solution?.slice(0, 300)}
` : ''}

SCRIPT:
${scriptContent}

Does this script tell a coherent story where each part connects logically? Or does it feel like random facts stitched together?`
            }
          ],
          max_tokens: 400,
          temperature: 0.3,
        });
        
        const coherenceJson = coherenceResponse.choices[0]?.message?.content || "";
        const jsonMatch = coherenceJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          coherenceScore = typeof parsed.score === "number" ? Math.max(1, Math.min(10, parsed.score)) * 10 : coherenceScore;
          coherenceCheck = {
            coherent: parsed.coherent === true || parsed.score >= 7,
            issues: parsed.issues || [],
            suggestions: parsed.suggestions || []
          };
        }
        
        console.log(`Coherence check attempt ${coherenceAttempts}: coherent=${coherenceCheck.coherent}, issues=${coherenceCheck.issues.length}`);
        
        // If not coherent, regenerate the script with coherence feedback
        if (!coherenceCheck.coherent && coherenceAttempts < maxCoherenceAttempts) {
          const coherenceFeedback = `
CRITICAL COHERENCE ISSUES - YOUR PREVIOUS SCRIPT FELT LIKE RANDOM FACTS STITCHED TOGETHER:
${coherenceCheck.issues.map(i => `- ${i}`).join('\n')}

FIX SUGGESTIONS:
${coherenceCheck.suggestions.map(s => `- ${s}`).join('\n')}

REWRITE with a SINGLE NARRATIVE THREAD:
1. Hook must set up what's coming
2. Problem section introduces ONE specific pain point
3. Solution must DIRECTLY address that problem (not go off on tangents)
4. Every fact/stat must support the core teaching
5. CTA must naturally follow from the teaching

DO NOT just list random tips. Tell a STORY with a beginning, middle, and end.`;

          const retryResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt + coherenceFeedback }
            ],
            max_tokens: 1500,
            temperature: 0.6,
          });
          
          scriptContent = retryResponse.choices[0]?.message?.content || scriptContent;
          
          // Re-validate basic checks after coherence rewrite
          gradeLevel = calculateGradeLevel(scriptContent);
          ctaValid = ctaIsPresent(scriptContent, finalCta);
          const scriptWords = scriptContent.split(/\s+/).filter(Boolean);
          currentWordCount = scriptWords.length;
          wordCountValid = currentWordCount >= effectiveWordTarget.min && currentWordCount <= effectiveWordTarget.max;
          estimatedSeconds = estimateDurationSeconds(currentWordCount, cloneWordsPerMinute || undefined);
          const durationTolerance = isCloneMode ? 0.1 : 0.15;
          const minDuration = Math.floor(targetDurationSeconds * (1 - durationTolerance));
          const maxDuration = Math.ceil(targetDurationSeconds * (1 + durationTolerance));
          durationValid = estimatedSeconds >= minDuration && estimatedSeconds <= maxDuration;
          styleMatch = styleMatchScore(referenceStyleSource, scriptContent);
        }
      } catch (error) {
        console.error("Coherence validation failed:", error);
        coherenceCheck = { coherent: true, issues: [], suggestions: [] }; // Skip on error
      }
    }
    
    if (!coherenceCheck.coherent) {
      console.warn(`Script coherence issues after ${maxCoherenceAttempts} attempts: ${coherenceCheck.issues.join(', ')}`);
    }
    
    const wordCount = currentWordCount;

    const durationMatchScore = (() => {
      if (!targetDurationSeconds || targetDurationSeconds <= 0) return 80;
      const deltaPct = Math.abs(estimatedSeconds - targetDurationSeconds) / targetDurationSeconds;
      return Math.max(0, Math.round(100 - Math.min(100, deltaPct * 300)));
    })();

    const topicRelevanceScore = topicRelevance.totalKeywords > 0
      ? Math.round((topicRelevance.matchedKeywords / topicRelevance.totalKeywords) * 100)
      : 100;
    const ctaScore = ctaValid ? 100 : 0;
    const normalizedStyleScore = enforceStyleMatch ? styleMatch : 85;
    const overallScore = Math.round(
      durationMatchScore * 0.2 +
      normalizedStyleScore * 0.25 +
      coherenceScore * 0.2 +
      ctaScore * 0.15 +
      topicRelevanceScore * 0.2
    );

    // Enhanced production notes with music resources
    const musicResources = [
      { name: "Epidemic Sound", url: "https://www.epidemicsound.com", type: "Paid (free trial)" },
      { name: "Artlist", url: "https://artlist.io", type: "Paid" },
      { name: "Uppbeat", url: "https://uppbeat.io", type: "Free + Paid" },
      { name: "Pixabay Music", url: "https://pixabay.com/music", type: "Free" },
      { name: "YouTube Audio Library", url: "https://studio.youtube.com/channel/UC/music", type: "Free" },
      { name: "Mixkit", url: "https://mixkit.co/free-stock-music", type: "Free" },
    ];

    // Build production notes as a string (per interface requirement)
    const tips = [
      "Film multiple takes - energy varies",
      "Use the first take energy on final edit", 
      "Add captions for accessibility and engagement",
      researchContext ? "Emphasize researched stats with text overlays" : "",
    ].filter(Boolean);
    
    const productionNotes = `FILMING: Film close-up, direct to camera. High energy on the hook. ${researchContext ? "Script includes researched data - emphasize stats with text overlays." : ""} Natural pauses between key points. ${params.platform === "tiktok" ? "Keep cuts fast and dynamic." : "Match the pace to your audience."}

TIPS: ${tips.join(" | ")}

MUSIC RESOURCES: Epidemic Sound, Artlist, Uppbeat, Pixabay Music, YouTube Audio Library, Mixkit`;

    const bRollIdeas = [
      `Screen recording demonstrating ${params.topic?.split(" ").slice(0, 3).join(" ") || "concept"}`,
      `Before/after comparison graphics with stats`,
      `Text animations for key data points`,
      `Close-up hands or demonstrating actions`,
      `Reaction shots or nodding moments`,
    ];

    // Generate engaging on-screen text overlay options
    let overlayOptions: { section: string; options: string[] }[] = [];
    try {
      const overlayResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You generate attention-grabbing on-screen text overlays for short-form videos. These are the text that appears on screen to capture attention and reinforce key points.

For each section (HOOK, BODY, CTA), provide exactly 3 short, punchy text options that:
- Are 2-6 words max
- Create curiosity or urgency
- Are NOT labels like "Hook" or "Key Point"
- Are actual engaging text viewers will see on screen
- Use power words, numbers, or emotional triggers

Examples of GOOD overlay text:
- "Wait for it..."
- "This changed EVERYTHING"
- "73% don't know this"
- "The $10M secret"
- "Nobody talks about this"
- "Watch till the end"
- "Save this NOW"

Examples of BAD overlay text:
- "Hook"
- "Key Stat"
- "Insight"
- "Follow me"

Respond in JSON format only.`
          },
          {
            role: "user",
            content: `Generate on-screen text overlay options for this script:

TOPIC: ${params.topic}
SCRIPT: ${scriptContent.slice(0, 500)}

Return JSON in this exact format:
{
  "hook": ["option1", "option2", "option3"],
  "body": ["option1", "option2", "option3"],
  "cta": ["option1", "option2", "option3"]
}`
          }
        ],
        max_tokens: 300,
        temperature: 0.9,
      });

      const overlayJson = overlayResponse.choices[0]?.message?.content || "";
      // Clean up potential markdown fences and extract JSON
      const cleanedJson = overlayJson
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      
      const parsed = JSON.parse(cleanedJson);
      
      // Validate parsed structure
      const hookOptions = Array.isArray(parsed.hook) 
        ? parsed.hook.filter((x: any) => typeof x === 'string').slice(0, 3)
        : [];
      const bodyOptions = Array.isArray(parsed.body)
        ? parsed.body.filter((x: any) => typeof x === 'string').slice(0, 3)
        : [];
      const ctaOptions = Array.isArray(parsed.cta)
        ? parsed.cta.filter((x: any) => typeof x === 'string').slice(0, 3)
        : [];
      
      overlayOptions = [
        { section: "Hook", options: hookOptions },
        { section: "Body", options: bodyOptions },
        { section: "CTA", options: ctaOptions },
      ];
    } catch (e) {
      // Fallback overlay options
      overlayOptions = [
        { section: "Hook", options: ["Wait for it...", "This changes everything", "Nobody talks about this"] },
        { section: "Body", options: ["The secret is...", "Here's what works", "Most people miss this"] },
        { section: "CTA", options: ["Save this NOW", "Don't scroll past", "You need this"] },
      ];
    }

    // Flatten overlayOptions to a string array for the interface
    const onScreenText = overlayOptions.flatMap(section => 
      section.options.map(opt => `[${section.section}] ${opt}`)
    );

    const cameraAngles = [
      "Talking head - center frame, eye level",
      "Slight angle for variety on longer points",
      "Close-up for emotional moments or key reveals",
      "Wide shot for context if needed",
    ];

    const transitions = [
      "Jump cut between sentences for energy",
      "Zoom punch on statistics or key words",
      "Swipe transition for new sections",
      "Flash frame for emphasis on reveals",
    ];

    const musicMood = params.tone === "high_energy" 
      ? "Upbeat, driving electronic - 120+ BPM. Motivational energy."
      : params.tone === "vulnerable"
      ? "Soft ambient piano - emotional, reflective. Keep subtle."
      : "Modern lo-fi or chill beat - 80-100 BPM. Not distracting.";

    const captionStyle = params.platform === "tiktok"
      ? "Bold, centered captions with 3-4 words max per line. Yellow/white with black outline. Animate key words and stats."
      : params.platform === "instagram"
      ? "Clean white captions, minimal animation. Consider branded colors."
      : "Standard auto-captions. Ensure accuracy before posting.";

    const pacing = params.duration === "30" 
      ? "Fast and punchy - no pauses longer than 0.5s"
      : params.duration === "60"
      ? "Medium pace - let key points breathe for 1s"
      : "Conversational pace - natural pauses for emphasis";

    const lighting = "Ring light or soft box at 45-degree angle. Fill light optional. Avoid harsh shadows.";

    const scriptLines = scriptContent.split("\n\n").filter(Boolean);
    const totalDuration = parseInt(params.duration) || 60;
    const perScene = Math.floor(totalDuration / Math.max(scriptLines.length, 4));
    
    const scenes = [
      {
        section: "Hook",
        lines: scriptLines[0] || "",
        duration: `0:00 - 0:0${Math.min(perScene, 5)}`,
        camera: "Center frame, slight zoom in",
        energy: "HIGH - grab attention immediately"
      },
      {
        section: "Setup",
        lines: scriptLines.slice(1, 3).join(" "),
        duration: `0:0${perScene} - 0:${perScene * 2}`,
        camera: "Angle left or right",
        energy: "Building - establish context"
      },
      {
        section: "Core Content",
        lines: scriptLines.slice(3, -1).join(" "),
        duration: `0:${perScene * 2} - 0:${perScene * 4}`,
        camera: "Mix of angles + B-roll cuts",
        energy: "Medium-high - deliver value with specifics"
      },
      {
        section: "Call to Action",
        lines: finalCta,
        duration: `0:${Math.max(totalDuration - 5, perScene * 4)} - 0:${totalDuration}`,
        camera: "Center frame, direct to camera",
        energy: "Warm - personal connection"
      }
    ];

    return {
      id: randomUUID(),
      script: scriptContent,
      wordCount,
      gradeLevel: Math.round(gradeLevel * 10) / 10,
      productionNotes,
      bRollIdeas,
      onScreenText,
      cameraAngles,
      transitions,
      musicMood,
      captionStyle,
      pacing,
      lighting,
      scenes,
      parameters: params,
      createdAt: new Date(),
      research: researchContext || undefined,
      referenceAnalysis: referenceAnalysis || undefined,
      qualityReport: {
        overallScore,
        durationMatchScore,
        styleMatchScore: normalizedStyleScore,
        coherenceScore,
        ctaScore,
        topicRelevanceScore,
        targetSeconds: targetDurationSeconds,
        estimatedSeconds,
        targetWordMin: effectiveWordTarget.min,
        targetWordMax: effectiveWordTarget.max,
        actualWords: wordCount,
      },
    };
  } catch (error) {
    console.error("AI script generation failed, falling back to template:", error);
    return generateScript(params);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  setupPasswordReset(app);
  
  // Comprehensive health check endpoint - verify ALL configuration
  app.get("/api/health", (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      isProduction: !!process.env.REPLIT_DEPLOYMENT,
      config: {
        openai: {
          hasOwnKey: hasOwnOpenAIKey,
          hasReplitKey: hasReplitAIKey,
          keyLength: openaiApiKey ? openaiApiKey.length : 0,
          baseUrl: openaiBaseURL || 'NOT SET',
        },
        supabase: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        database: {
          hasUrl: !!process.env.DATABASE_URL,
        },
        session: {
          hasSecret: !!process.env.SESSION_SECRET,
        }
      },
      issues: [] as string[]
    };
    
    // Check for issues
    if (!process.env.OPENAI_API_KEY) {
      health.issues.push('OPENAI_API_KEY not set - AI features will fail');
    }
    if (!process.env.SUPABASE_URL) {
      health.issues.push('SUPABASE_URL not set - Authentication will fail');
    }
    if (!process.env.SUPABASE_ANON_KEY) {
      health.issues.push('SUPABASE_ANON_KEY not set - Authentication will fail');
    }
    if (!process.env.DATABASE_URL) {
      health.issues.push('DATABASE_URL not set - Database features will fail');
    }
    
    if (health.issues.length > 0) {
      health.status = 'degraded';
    }
    
    res.json(health);
  });

  // AI Health Check endpoint - test if OpenAI integration is working
  app.get("/api/ai/health", async (req, res) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say 'OK' if you can hear me." }],
        max_tokens: 10,
      });
      
      const content = response.choices[0]?.message?.content || "";
      res.json({
        status: "healthy",
        response: content,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        baseURL: "https://api.openai.com/v1",
        isProduction: !!process.env.REPLIT_DEPLOYMENT,
      });
    } catch (error: any) {
      console.error("AI health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error?.message || "Unknown error",
        code: error?.code,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        baseURL: "https://api.openai.com/v1",
        isProduction: !!process.env.REPLIT_DEPLOYMENT,
      });
    }
  });
  
  app.get("/api/ctas", (req, res) => {
    res.json({
      categories: ctaCategories,
      options: ctaOptions,
    });
  });

  // CTA Template routes
  app.get("/api/cta/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const templates = await storage.getCtaTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching CTA templates:", error);
      res.status(500).json({ message: "Failed to fetch CTA templates" });
    }
  });

  app.post("/api/cta/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertCtaTemplateSchema.parse({
        ...req.body,
        userId,
      });
      
      const template = await storage.createCtaTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error creating CTA template:", error);
      res.status(500).json({ message: "Failed to save CTA template" });
    }
  });

  app.delete("/api/cta/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const template = await storage.getCtaTemplate(req.params.id);
      if (!template || template.userId !== userId) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      await storage.deleteCtaTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CTA template:", error);
      res.status(500).json({ message: "Failed to delete CTA template" });
    }
  });

  // Generate CTAs based on hook, problem, and solution (works for both regular wizard and clone flow)
  app.post("/api/cta/generate", async (req: any, res) => {
    try {
      const { hook, problem, solution, videoPurpose, targetAudience, topic, platform, originalCtaStyle, originalCtaLine } = req.body;
      
      const isCloneFlow = !!topic && !problem;
      
      if (!isCloneFlow && (!hook || !problem || !solution)) {
        return res.status(400).json({ message: "Hook, problem, and solution are required" });
      }

      const purposeGuidance = {
        authority: "Position the creator as an expert - CTAs should invite deeper engagement like following for more insights or commenting with questions",
        education: "Reinforce the learning value - CTAs should encourage saving the video, sharing with others who need this, or taking immediate action",
        storytelling: "Build emotional connection - CTAs should invite personal stories, shares, or follow-ups for part 2"
      };

      let prompt: string;
      
      if (isCloneFlow) {
        prompt = `You are a viral short-form video CTA expert. Generate 3 unique, conversational call-to-actions for a ${platform || "short-form"} video about "${topic}".

${hook ? `HOOK: "${hook}"` : ''}
${originalCtaStyle ? `ORIGINAL VIDEO'S CTA STYLE: ${originalCtaStyle.replace(/_/g, " ")}` : ''}
${originalCtaLine ? `ORIGINAL VIDEO'S CTA: "${originalCtaLine}" — Create variations that match this energy and style but adapt to the new topic.` : ''}
PLATFORM: ${platform || "tiktok"}

REQUIREMENTS:
1. Each CTA must feel like natural spoken words, not written copy
2. Match the style/energy of the original video's CTA if provided
3. Be specific to the topic "${topic}" — no generic phrases
4. Be 1-2 sentences max (under 15 words ideal)
5. Sound like something a real creator would say on camera
6. Create urgency or emotional resonance tied to the topic

OUTPUT FORMAT (JSON array):
[
  {
    "cta": "The actual call to action text",
    "category": "one of: follow, engage, save, link, action, community",
    "rationale": "Brief explanation of why this works"
  }
]

Generate 3 CTAs now:`;
      } else {
        prompt = `You are a viral short-form video CTA expert. Generate 3 unique, conversational call-to-actions based on this video's content.

VIDEO CONTEXT:
- Hook: "${hook}"
- Problem addressed: "${problem}"
- Core Teaching/Solution: "${solution}"
- Video Purpose: ${videoPurpose || "general"}
- Target Audience: ${targetAudience || "content creators"}

PURPOSE GUIDANCE: ${purposeGuidance[videoPurpose as keyof typeof purposeGuidance] || "Create engagement-focused CTAs"}

REQUIREMENTS:
1. Each CTA must feel like natural spoken words, not written copy
2. Connect directly to the solution/core teaching just provided
3. Create urgency or emotional resonance
4. Be 1-2 sentences max (under 15 words ideal)
5. Sound like something a real creator would say on camera
6. NO generic phrases like "follow for more" unless tied to specific value

OUTPUT FORMAT (JSON array):
[
  {
    "cta": "The actual call to action text",
    "category": "one of: follow, engage, save, link, action, community",
    "rationale": "Brief explanation of why this works"
  }
]

Generate 3 CTAs now:`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert at creating viral video CTAs. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      res.json({ suggestions });
    } catch (error: any) {
      console.error("CTA generation error:", error);
      const errorDetails = {
        message: error?.message || "Unknown error",
        status: error?.status,
        code: error?.code,
        type: error?.type,
        cause: error?.cause?.message,
        baseURL: openaiBaseURL,
        hasApiKey: hasOwnOpenAIKey,
        isProduction: isProductionDeployment,
      };
      console.error("CTA generation error details:", JSON.stringify(errorDetails, null, 2));
      
      const isConnectionError = error?.message?.includes('ECONNREFUSED') || 
                                error?.message?.includes('fetch failed') ||
                                error?.code === 'ECONNREFUSED';
      
      if (isConnectionError) {
        res.status(500).json({ 
          message: "AI service temporarily unavailable. Please try again.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate CTAs. Please try again.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      }
    }
  });

  // SSE Streaming generation endpoint - real-time progress updates
  app.post("/api/scripts/generate-stream", async (req: any, res) => {
    const params: ScriptParameters = req.body;
    const userId = req.user?.id;

    setupSSE(res);
    const tracker = createProgressTracker(res);

    // Handle client disconnect
    let cancelled = false;
    req.on("close", () => {
      cancelled = true;
    });

    const checkCancelled = () => {
      if (cancelled) {
        tracker.update("cancelled", "Generation cancelled by user");
        res.end();
        return true;
      }
      return false;
    };

    try {
      tracker.update("start", "Starting script generation...", {}, 5);

      if (!params.topic || params.topic.trim().length < 5) {
        tracker.error(ERROR_CODES.INVALID_TOPIC, "Topic must be at least 5 characters");
        return;
      }

      let knowledgeBaseDocs: KnowledgeBaseDoc[] = [];
      if (params.useKnowledgeBase && userId) {
        knowledgeBaseDocs = await storage.getKnowledgeBaseDocs(userId);
      }

      if (checkCancelled()) return;

      let creatorStyleMemory = "";
      if (userId) {
        try {
          const styleAnalysis = await getCachedStyleAnalysis(userId, () => storage.getRecentScripts(userId, 8));
          if (styleAnalysis.hasHistory) {
            creatorStyleMemory = styleAnalysis.summary;
          }
        } catch (error) {
          console.error("[Script Memory] Failed to analyze past scripts:", error);
        }
      }

      if (params.deepResearch) {
        tracker.update("research_start", "Researching your topic...", {}, 15);
      } else {
        tracker.update("generation_start", "Generating your script...", {}, 20);
      }

      if (checkCancelled()) return;

      tracker.update("generation_progress", "Writing script with quality checks...", {}, 50);

      let generatedScript: GeneratedScript;
      try {
        generatedScript = await generateScriptWithAI(params, knowledgeBaseDocs, creatorStyleMemory);
      } catch (aiError: any) {
        const { code, message } = parseOpenAIError(aiError);
        tracker.error(code, message);
        return;
      }

      if (checkCancelled()) return;

      tracker.update("validation_complete", "Quality checks passed!", {}, 80);
      tracker.update("saving_start", "Saving your script...", {}, 90);

      const savedScript = await storage.createScript({
        userId: userId || null,
        title: params.topic?.slice(0, 100) || "Untitled Script",
        script: generatedScript.script,
        wordCount: String(generatedScript.wordCount),
        gradeLevel: String(generatedScript.gradeLevel),
        productionNotes: generatedScript.productionNotes,
        bRollIdeas: JSON.stringify(generatedScript.bRollIdeas),
        onScreenText: JSON.stringify(generatedScript.onScreenText),
        parameters: params,
        status: "draft",
      });

      if (userId) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await storage.incrementUsage(userId, month, 'scriptsGenerated');
        const user = await storage.getUser(userId);
        if (user && (!user.plan || user.plan === 'starter')) {
          await storage.incrementTrialScriptsUsed(userId);
        }
        if (params.deepResearch) {
          await storage.incrementUsage(userId, month, 'deepResearchUsed');
        }
        if (params.useKnowledgeBase && knowledgeBaseDocs.length > 0) {
          await storage.incrementUsage(userId, month, 'knowledgeBaseQueries');
        }
      }

      tracker.complete({ ...generatedScript, id: savedScript.id });
    } catch (error: any) {
      console.error("[Stream Generate] Error:", error);
      tracker.error(
        ERROR_CODES.GENERATION_FAILED,
        error?.message || "Script generation failed. Please try again."
      );
    }
  });

  app.post("/api/scripts/generate", async (req: any, res) => {
    try {
      const params: ScriptParameters = req.body;
      const userId = req.user?.id;
      
      // Debug: Log if cloned video structure is being received
      console.log("[Script Generate] Received params:", {
        hasClonedVideoStructure: !!params.clonedVideoStructure,
        clonedVideoStructure: params.clonedVideoStructure ? {
          format: params.clonedVideoStructure.format,
          hookStyle: params.clonedVideoStructure.hookStyle,
          pacing: params.clonedVideoStructure.pacing,
        } : null,
      });
      
      // All features are free - no trial or subscription checks needed
      
      let knowledgeBaseDocs: KnowledgeBaseDoc[] = [];
      if (params.useKnowledgeBase && userId) {
        // Get user-specific knowledge base if authenticated
        knowledgeBaseDocs = await storage.getKnowledgeBaseDocs(userId);
      }
      
      // Script Memory: Analyze creator's past scripts for voice consistency
      let creatorStyleMemory = "";
      if (userId) {
        try {
          const styleAnalysis = await getCachedStyleAnalysis(userId, () => storage.getRecentScripts(userId, 8));
          if (styleAnalysis.hasHistory) {
            creatorStyleMemory = styleAnalysis.summary;
            console.log(`[Script Memory] Using style analysis from ${styleAnalysis.scriptCount} past scripts for user ${userId}`);
          }
        } catch (error) {
          console.error("[Script Memory] Failed to analyze past scripts:", error);
        }
      }
      
      const generatedScript = await generateScriptWithAI(params, knowledgeBaseDocs, creatorStyleMemory);
      
      const savedScript = await storage.createScript({
        userId: userId || null,
        title: params.topic?.slice(0, 100) || "Untitled Script",
        script: generatedScript.script,
        wordCount: String(generatedScript.wordCount),
        gradeLevel: String(generatedScript.gradeLevel),
        productionNotes: generatedScript.productionNotes,
        bRollIdeas: JSON.stringify(generatedScript.bRollIdeas),
        onScreenText: JSON.stringify(generatedScript.onScreenText),
        parameters: params,
        status: "draft",
      });
      
      // Track usage for authenticated users
      if (userId) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await storage.incrementUsage(userId, month, 'scriptsGenerated');
        
        // Increment trial scripts used for users on free trial
        const user = await storage.getUser(userId);
        if (user && (!user.plan || user.plan === 'starter')) {
          await storage.incrementTrialScriptsUsed(userId);
        }
        
        if (params.deepResearch) {
          await storage.incrementUsage(userId, month, 'deepResearchUsed');
        }
        if (params.useKnowledgeBase && knowledgeBaseDocs.length > 0) {
          await storage.incrementUsage(userId, month, 'knowledgeBaseQueries');
        }
      }
      
      res.json({
        ...generatedScript,
        id: savedScript.id,
      });
    } catch (error) {
      console.error("Error generating script:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });

  app.post("/api/scripts/generate-batch", async (req: any, res) => {
    try {
      const params: ScriptParameters = req.body;
      const userId = req.user?.id;
      const requested = Number(params.batchCount ?? 3);
      const batchCount = Math.min(Math.max(Number.isFinite(requested) ? requested : 3, 2), 5);

      if (!params.topic || params.topic.trim().length < 5) {
        return res.status(400).json({
          error: {
            code: ERROR_CODES.INVALID_TOPIC,
            message: "Topic must be at least 5 characters",
          },
        });
      }

      let knowledgeBaseDocs: KnowledgeBaseDoc[] = [];
      if (params.useKnowledgeBase && userId) {
        knowledgeBaseDocs = await storage.getKnowledgeBaseDocs(userId);
      }

      let creatorStyleMemory = "";
      if (userId) {
        try {
          const styleAnalysis = await getCachedStyleAnalysis(userId, () => storage.getRecentScripts(userId, 8));
          if (styleAnalysis.hasHistory) {
            creatorStyleMemory = styleAnalysis.summary;
          }
        } catch (error) {
          console.error("[Script Memory] Failed to analyze past scripts:", error);
        }
      }

      const scripts: GeneratedScript[] = [];
      for (let i = 0; i < batchCount; i++) {
        const variantParams: ScriptParameters = {
          ...params,
          // Nudge variability without changing user's core topic.
          keyFacts: `${params.keyFacts || ""}${params.keyFacts ? "\n" : ""}Variation mode: produce a distinctly different angle and opening from prior variants.`,
        };

        const generatedScript = await generateScriptWithAI(variantParams, knowledgeBaseDocs, creatorStyleMemory);

        const savedScript = await storage.createScript({
          userId: userId || null,
          title: `${params.topic?.slice(0, 90) || "Untitled Script"} (Variant ${i + 1})`,
          script: generatedScript.script,
          wordCount: String(generatedScript.wordCount),
          gradeLevel: String(generatedScript.gradeLevel),
          productionNotes: generatedScript.productionNotes,
          bRollIdeas: JSON.stringify(generatedScript.bRollIdeas),
          onScreenText: JSON.stringify(generatedScript.onScreenText),
          parameters: params,
          status: "draft",
        });

        scripts.push({
          ...generatedScript,
          id: savedScript.id,
        });
      }

      if (userId) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        for (let i = 0; i < batchCount; i++) {
          await storage.incrementUsage(userId, month, 'scriptsGenerated');
        }

        const user = await storage.getUser(userId);
        if (user && (!user.plan || user.plan === 'starter')) {
          for (let i = 0; i < batchCount; i++) {
            await storage.incrementTrialScriptsUsed(userId);
          }
        }

        if (params.deepResearch) {
          for (let i = 0; i < batchCount; i++) {
            await storage.incrementUsage(userId, month, 'deepResearchUsed');
          }
        }
        if (params.useKnowledgeBase && knowledgeBaseDocs.length > 0) {
          for (let i = 0; i < batchCount; i++) {
            await storage.incrementUsage(userId, month, 'knowledgeBaseQueries');
          }
        }
      }

      res.json({
        count: scripts.length,
        scripts,
      });
    } catch (error) {
      console.error("Error generating script batch:", error);
      const parsed = parseOpenAIError(error);
      res.status(parsed.statusCode).json({
        error: {
          code: parsed.code,
          message: parsed.message,
        },
      });
    }
  });

  // Enhance an existing script with AI
  app.post("/api/scripts/enhance", async (req, res) => {
    try {
      const { script, enhancementType, parameters } = req.body;
      
      if (!script || typeof script !== 'string') {
        return res.status(400).json({ error: "Script content is required" });
      }
      
      const enhancementPrompts: Record<string, string> = {
        punchier: `Make this script more punchy and attention-grabbing:
- Use shorter sentences (5-10 words max)
- Add more pattern interrupts
- Make transitions snappier
- Increase urgency and energy
- Use simple power words a 3rd grader knows`,
        authority: `Rewrite this script in strong expert authority style:
      - Confident, decisive, no hedging language
      - Use clear frameworks and "do this / avoid this" guidance
      - Keep claims specific and practical
      - Remove tentative language like "maybe" or "might"
      - Keep wording simple and spoken`,
        clearer: `Make this script clearer and simpler:
- Use grade 3 reading level (elementary school)
- Replace all jargon with simple everyday words
- Use concrete examples instead of abstract ideas
- Short sentences, one idea per sentence
- No business speak or corporate language`,
        storytelling: `Enhance the storytelling in this script:
- Add more narrative elements
- Create stronger emotional hooks
- Add vivid but simple details
- Build better tension and payoff
- Keep language simple (grade 3 level)`,
        high_retention: `Rewrite this script for maximum retention:
      - Hard hook in first line
      - Open at least one curiosity loop in first 2-3 lines
      - Add 2 pattern interrupts in the body
      - Tighten transitions so each line creates forward pull
      - Keep pace fast and spoken`,
        style_match: `Rewrite this script to closely match the creator/reference style:
      - Mirror sentence rhythm and energy
      - Match vocabulary simplicity and tone
      - Keep the same section flow and pacing
      - Preserve the original creator voice while improving clarity
      - Do not sound generic`,
        engagement: `Optimize this script for maximum engagement:
- Strengthen the hook to stop the scroll
- Add more curiosity gaps
- Include pattern interrupts throughout
- Keep the EXACT same CTA - do not change it
- Add moments that encourage saves/shares`,
        general: `Improve this script to be more viral-worthy:
- Use simpler words (grade 3 reading level)
- Tighten the language (every word must earn its place)
- Increase the hook strength
- Add more specific details and numbers
- Keep the EXACT same CTA - do not change it`,
      };
      
      const enhancementPrompt = enhancementPrompts[enhancementType] || enhancementPrompts.general;
      
      // Helper functions for validation
      const calculateGradeLevel = (text: string): number => {
        const words = text.split(/\s+/).filter(Boolean);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
        return Math.max(3, Math.min(12, 0.39 * avgWordsPerSentence + 4));
      };

      const estimateDurationSeconds = (wordCount: number): number => {
        // Average short-form spoken pace target.
        return Math.round((wordCount / 172) * 60);
      };

      const styleScore = (source: string, candidate: string): number => {
        const sent = (t: string) => t.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
        const aSent = sent(source);
        const bSent = sent(candidate);
        const aWords = source.split(/\s+/).filter(Boolean);
        const bWords = candidate.split(/\s+/).filter(Boolean);
        const aAvg = aSent.length ? aWords.length / aSent.length : 0;
        const bAvg = bSent.length ? bWords.length / bSent.length : 0;
        const aQ = aSent.length ? ((source.match(/\?/g) || []).length / aSent.length) : 0;
        const bQ = bSent.length ? ((candidate.match(/\?/g) || []).length / bSent.length) : 0;
        const aBang = aSent.length ? ((source.match(/!/g) || []).length / aSent.length) : 0;
        const bBang = bSent.length ? ((candidate.match(/!/g) || []).length / bSent.length) : 0;
        const delta = Math.abs(aAvg - bAvg) * 3 + Math.abs(aQ - bQ) * 100 + Math.abs(aBang - bBang) * 100;
        return Math.max(0, Math.round(100 - Math.min(100, delta)));
      };
      
      // Extract CTA from original script (last section after **CTA**)
      const extractCta = (text: string): string => {
        const ctaMatch = text.match(/\*\*CTA\*\*[\s\S]*$/i);
        return ctaMatch ? ctaMatch[0].trim() : '';
      };
      
      const originalCta = extractCta(script);
      const originalWords = script.split(/\s+/).filter(Boolean).length;
      const targetDuration = Number(parameters?.duration) || Math.round((originalWords / 172) * 60);
      const durationMin = Math.floor(targetDuration * 0.9);
      const durationMax = Math.ceil(targetDuration * 1.1);
      
      let enhancedScript = script;
      let attempts = 0;
      const maxAttempts = 3;
      let gradeLevel = 10;
      let enhancedWordCount = originalWords;
      let estimatedSeconds = estimateDurationSeconds(originalWords);
      let ctaOk = true;
      let lengthOk = true;
      let styleOk = true;
      let currentStyleScore = 100;

      const requiresStyle = enhancementType === 'style_match' || !!parameters?.referenceScript || !!parameters?.clonedVideoStructure;
      const minStyleScore = enhancementType === 'style_match' ? 70 : 60;
      
      while (attempts < maxAttempts && (gradeLevel > 5 || !lengthOk || !ctaOk || (requiresStyle && !styleOk))) {
        attempts++;
        const temperature = attempts === 1 ? 0.7 : 0.5;
        const retryHints: string[] = [];
        if (attempts > 1) {
          if (gradeLevel > 5) retryHints.push('Use simpler words and shorter sentences.');
          if (!lengthOk) retryHints.push(`Keep runtime near ${targetDuration}s. Current estimated runtime is ${estimatedSeconds}s.`);
          if (!ctaOk) retryHints.push('Keep the CTA exactly unchanged from original script.');
          if (requiresStyle && !styleOk) retryHints.push(`Increase style fidelity. Current style score ${currentStyleScore}/100; need ${minStyleScore}+.`);
        }
        const retryHint = retryHints.length ? `\n\nPREVIOUS ATTEMPT ISSUES:\n- ${retryHints.join('\n- ')}` : '';
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert script enhancer who writes like a HUMAN, not an AI.

CRITICAL RULES:
1. GRADE 3 READING LEVEL: Use simple words. Short sentences (5-10 words max). No jargon.
2. KEEP EXACT CTA: The CTA section must stay EXACTLY the same - do NOT change or improve it.
3. SOUND HUMAN: Write like you're texting a friend. Be casual. No corporate speak.
4. KEEP STRUCTURE: Maintain HOOK, BODY, CTA structure if present.
5. SAME LENGTH: Stay within 10% of original word count and keep spoken runtime near target.
6. BANNED WORDS: leverage, unleash, game-changer, revolutionary, elevate, empower, unlock, transform, cutting-edge, dive in, unpack, seamlessly
7. DURATION TARGET: Keep estimated runtime near ${targetDuration}s (acceptable ${durationMin}-${durationMax}s).

${enhancementPrompt}`
            },
            {
              role: "user",
              content: `Enhance this script:

${script}

Return ONLY the enhanced script with no explanations or commentary.${retryHint}`
            }
          ],
          max_tokens: 1500,
          temperature,
        });
        
        enhancedScript = response.choices[0]?.message?.content || script;
        gradeLevel = calculateGradeLevel(enhancedScript);
        enhancedWordCount = enhancedScript.split(/\s+/).filter(Boolean).length;
        estimatedSeconds = estimateDurationSeconds(enhancedWordCount);
        lengthOk = enhancedWordCount >= Math.floor(originalWords * 0.9) && enhancedWordCount <= Math.ceil(originalWords * 1.1)
          && estimatedSeconds >= durationMin
          && estimatedSeconds <= durationMax;
        ctaOk = originalCta ? enhancedScript.toLowerCase().includes(originalCta.toLowerCase().replace(/\s+/g, ' ').trim()) : true;
        currentStyleScore = styleScore(script, enhancedScript);
        styleOk = !requiresStyle || currentStyleScore >= minStyleScore;
        
        console.log(`Enhancement attempt ${attempts}: grade=${gradeLevel.toFixed(1)}, words=${enhancedWordCount}, duration=${estimatedSeconds}s, ctaOk=${ctaOk}, style=${currentStyleScore}`);
      }
      
      // Calculate final metrics
      const words = enhancedScript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      
      res.json({
        enhancedScript,
        wordCount,
        gradeLevel: Math.round(gradeLevel * 10) / 10,
        estimatedSeconds,
        styleMatchScore: currentStyleScore,
        ctaPreserved: ctaOk,
        enhancementType: enhancementType || 'general',
      });
    } catch (error) {
      console.error("Error enhancing script:", error);
      res.status(500).json({ error: "Failed to enhance script" });
    }
  });

  // AI Chat Script Refinement - conversational script editing
  app.post("/api/scripts/refine", async (req, res) => {
    try {
      const { script, userRequest, parameters, chatHistory } = req.body;
      
      if (!script || typeof script !== 'string') {
        return res.status(400).json({ error: "Script content is required" });
      }
      
      if (!userRequest || typeof userRequest !== 'string') {
        return res.status(400).json({ error: "User request is required" });
      }

      const topic = parameters?.topic || "";
      const category = parameters?.category || "";
      const platform = parameters?.platform || "tiktok";

      // PHASE 1: Deep research & analysis on the user's request
      const researchResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a viral content research analyst. Your job is to deeply research a topic/angle and produce insights that will make a short-form video script more compelling.

When the user describes what they want changed or improved in their script, you must:
1. Research the UNDERLYING INTENT behind their request - what would actually make this better?
2. Find specific data points, statistics, real examples, expert perspectives, and counter-arguments from sources like Reddit threads, Quora discussions, industry blogs, and social media trends
3. Identify what the TOP viral creators in this niche do differently
4. Find specific hooks, phrases, storytelling techniques, or psychological triggers that work for this type of content
5. Consider what objections or questions the audience might have
6. Look for contrarian angles, surprising facts, or pattern interrupts that would boost engagement

DO NOT just repeat the user's words back. Actually analyze and research.

Respond in JSON:
{
  "researchFindings": "Detailed research notes with specific data points, examples, stats, expert quotes, audience psychology insights",
  "viralTechniques": "Specific viral techniques and patterns from top creators that apply here",
  "suggestedAngle": "The best angle/approach to take based on research",
  "specificDetails": "Concrete details, numbers, examples, analogies that should be woven into the script"
}`
          },
          {
            role: "user",
            content: `TOPIC/NICHE: ${topic || category}
PLATFORM: ${platform}

CURRENT SCRIPT:
${script}

USER'S REQUEST: "${userRequest}"

Research this deeply. Find real insights, data points, viral patterns, audience psychology, and specific details that would genuinely improve this script based on what the user wants. Don't just take their words literally - understand what they're really trying to achieve and find the best way to get there.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const researchContent = researchResponse.choices[0]?.message?.content || "{}";
      let research;
      try {
        research = JSON.parse(researchContent);
      } catch {
        research = { researchFindings: "", viralTechniques: "", suggestedAngle: "", specificDetails: "" };
      }

      // Build chat context from history
      const historyMessages = (chatHistory || []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // PHASE 2: Rewrite the script using the research
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an elite short-form video scriptwriter who creates viral content. You have deep expertise in TikTok/Instagram Reels storytelling, audience psychology, and content virality.

You just received deep research on how to improve a script. Use this research to INTELLIGENTLY rewrite the script - don't just copy the user's words into it.

RESEARCH FINDINGS:
${research.researchFindings || "No additional research available."}

VIRAL TECHNIQUES TO APPLY:
${research.viralTechniques || "Use standard viral techniques."}

SUGGESTED ANGLE:
${research.suggestedAngle || "Maintain current angle."}

SPECIFIC DETAILS TO WEAVE IN:
${research.specificDetails || "Use compelling details."}

YOUR RULES:
1. NEVER just copy-paste the user's exact words into the script. Instead, understand their intent and use the research to craft something better
2. Weave in specific stats, examples, analogies, and details from the research naturally
3. Keep the same structure (HOOK, BODY, CTA sections if present)
4. Stay within 25% of the original word count
5. Use grade 3-5 reading level (simple words, short sentences, conversational)
6. Sound like a real person talking to camera, not reading an essay
7. Every sentence should earn its place - cut fluff, add substance
8. Use pattern interrupts, open loops, and engagement triggers
9. The hook must stop the scroll within 1-2 seconds
10. Include specificity (numbers, names, timeframes) instead of vague claims

BANNED AI WORDS: leverage, unleash, game-changer, revolutionary, elevate, empower, unlock, transform, cutting-edge, dive in, unpack, seamlessly, delve, tapestry, embark, journey, robust, passionate, landscape

Respond in JSON:
{
  "refinedScript": "the completely rewritten script using research insights",
  "explanation": "2-3 sentence explanation of what research you found and how you used it to improve the script (mention specific improvements)"
}`
          },
          ...historyMessages,
          {
            role: "user",
            content: `CURRENT SCRIPT:

${script}

---

USER'S REQUEST: "${userRequest}"

Using the research provided in the system prompt, intelligently rewrite this script. Do NOT just insert the user's words - use the research to find the BEST way to accomplish what they're asking for. Make it genuinely better with real insights, specific details, and viral techniques.

Return JSON with "refinedScript" and "explanation" fields.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { refinedScript: script, explanation: "Could not parse the response." };
      }

      const refinedScript = parsed.refinedScript || script;
      const explanation = parsed.explanation || "I've researched and improved the script based on your request.";

      // Calculate metrics
      const words = refinedScript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const sentences = refinedScript.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
      const gradeLevel = Math.max(3, Math.min(12, 0.39 * avgWordsPerSentence + 4));

      res.json({
        refinedScript,
        explanation,
        wordCount,
        gradeLevel: Math.round(gradeLevel * 10) / 10,
      });
    } catch (error) {
      console.error("Error refining script:", error);
      res.status(500).json({ error: "Failed to refine script" });
    }
  });

  // Boost Virality: Analyze script and improve viral score
  app.post("/api/scripts/boost", async (req, res) => {
    try {
      const { script, parameters, viralExamples } = req.body;
      
      if (!script || typeof script !== 'string') {
        return res.status(400).json({ error: "Script content is required" });
      }
      
      // Calculate current viral score breakdown
      const scriptLower = script.toLowerCase();
      const firstLine = script.split('\n')[0] || '';
      
      // Grade level analysis
      const words = script.split(/\s+/).filter(Boolean);
      const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
      const gradeLevel = Math.max(3, Math.min(12, 0.39 * avgWordsPerSentence + 4));
      
      // Hook strength analysis - calculate a meaningful 0-10 score
      const calculateHookStrength = (hook: string): number => {
        let score = 0;
        const hookLower = hook.toLowerCase().trim();
        
        // Pattern triggers (each worth 1-2 points)
        const strongPatterns = [
          { pattern: /^(stop|wait|don't|never)/i, points: 2 },
          { pattern: /^(why|how|what if)/i, points: 2 },
          { pattern: /^(i |i'm |i've |i was)/i, points: 1.5 },
          { pattern: /^(the truth|nobody|most people)/i, points: 2 },
          { pattern: /^(here's|this is)/i, points: 1 },
          { pattern: /^\d+/, points: 1.5 },
          { pattern: /\d+\s*(million|billion|k|\$|%|x)/i, points: 2 },
          { pattern: /\?$/, points: 1 },
        ];
        for (const { pattern, points } of strongPatterns) {
          if (pattern.test(hook)) score += points;
        }
        
        // Length bonus (short hooks are punchier)
        if (hookLower.length > 0 && hookLower.length <= 50) score += 1.5;
        else if (hookLower.length <= 80) score += 0.5;
        
        // Emotional/power words bonus
        const powerWords = /\b(secret|truth|mistake|never|always|best|worst|shocking|crazy|insane|genius)\b/i;
        if (powerWords.test(hookLower)) score += 1.5;
        
        // Contrast/tension bonus
        const contrastWords = /\b(but|however|instead|actually|until)\b/i;
        if (contrastWords.test(hookLower)) score += 1;
        
        // Cap at 10
        return Math.min(10, Math.round(score));
      };
      
      const hookStrength = calculateHookStrength(firstLine);
      
      // Specificity analysis - count numbers and specific details
      const numberMatches = script.match(/\d+/g) || [];
      const specificityScore = Math.min(25, numberMatches.length * 5);
      
      // Engagement patterns
      const engagementPatterns = [/\byou\b/i, /\byour\b/i, /\bbecause\b/i, /\bnow\b/i, /\btoday\b/i];
      const engagementMatches = engagementPatterns.filter(p => p.test(scriptLower)).length;
      
      // Identify weak areas - MORE AGGRESSIVE thresholds for stronger improvements
      const weakAreas: string[] = [];
      if (gradeLevel > 5) weakAreas.push("reading_level"); // Lowered from 6 to 5
      if (hookStrength < 6) weakAreas.push("hook"); // Raised from 2 to 6 - always try to improve hooks
      if (specificityScore < 20) weakAreas.push("specificity"); // Raised from 15 to 20
      if (engagementMatches < 4) weakAreas.push("engagement"); // Raised from 3 to 4
      if (avgWordsPerSentence > 10) weakAreas.push("sentence_length"); // Lowered from 12 to 10
      
      // Build viral examples context for the AI
      let viralContext = "";
      if (viralExamples && Array.isArray(viralExamples.examples) && viralExamples.examples.length > 0) {
        viralContext = `
VIRAL BENCHMARKS (study these proven patterns):
${viralExamples.examples.slice(0, 3).map((ex: any) => `- "${ex.hookLine}" (${Math.round(ex.views / 1000)}K views, ${ex.engagementRate}% engagement)`).join('\n')}

Top hook types working: ${viralExamples.dominantHookTypes?.join(', ') || 'various'}
Avg engagement: ${viralExamples.avgEngagement}%
`;
      }
      
      // Build improvement instructions based on weak areas - MORE AGGRESSIVE improvements
      const improvementInstructions: string[] = [];
      if (weakAreas.includes("reading_level")) {
        improvementInstructions.push(`SIMPLIFY LANGUAGE AGGRESSIVELY:
- Target 4th-5th grade reading level (current: grade ${gradeLevel.toFixed(1)})
- Replace ALL multi-syllable words with simple alternatives
- "Utilize" → "use", "Implement" → "do", "Significant" → "big"
- Max 6-8 words per sentence
- One syllable words are KING`);
      }
      if (weakAreas.includes("hook")) {
        improvementInstructions.push(`COMPLETELY REWRITE THE HOOK (current strength: ${hookStrength}/10):
- First 3 seconds decide everything - make them IMPOSSIBLE to skip
- Use ONE of these proven patterns:
  * STOP pattern: "Stop [doing X]..." or "Wait, [shocking statement]"
  * DIRECT ATTACK: "You're doing [X] wrong" or "Nobody tells you this about [X]"
  * SHOCKING STAT: "97% of people [fail at X]" or "[Number] that changed everything"
  * CONTRARIAN: "Unpopular opinion:" or "I'm gonna get hate for this but..."
  * STORY OPEN: "I was [doing X] when..." or "Last week I [discovered X]"
- Hook MUST create a curiosity gap or emotional reaction
- Sound like a REAL person talking, not a headline`);
      }
      if (weakAreas.includes("specificity")) {
        improvementInstructions.push(`ADD HARD-HITTING SPECIFICS:
- Replace "a lot" with exact numbers: "47 people", "$2,340", "3 days"
- Add timeframes: "in 14 days", "took me 6 months", "in just 2 hours"
- Include real examples: names, places, specific situations
- Credibility boosters: "after testing 100 times", "from 500 interviews"`);
      }
      if (weakAreas.includes("engagement")) {
        improvementInstructions.push(`MAXIMIZE VIEWER CONNECTION:
- Add "you" at least 5 times - make it about THEM
- Create micro-hooks: "Here's the thing..." "But here's what nobody tells you..."
- Add pattern interrupts every 2-3 sentences
- Rhetorical questions: "You know what happened?" "Wanna know why?"
- Direct challenges: "Try this right now" "Watch what happens"`);
      }
      if (weakAreas.includes("sentence_length")) {
        improvementInstructions.push(`CHOP SENTENCES RUTHLESSLY:
- Current avg: ${avgWordsPerSentence.toFixed(0)} words - TARGET: 6-8 words max
- One idea per sentence. Period.
- Use fragments for impact. Like this. Boom.
- Vary rhythm: short. Short. Then slightly longer to explain.`);
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Upgraded from gpt-4o-mini for stronger improvements
        messages: [
          {
            role: "system",
            content: `You are an ELITE viral content optimizer who has studied 10,000+ viral TikTok/Reels/Shorts. Your improvements are AGGRESSIVE and TRANSFORMATIVE.

IDENTITY: You write like Mr. Beast's scriptwriters + Alex Hormozi's directness + Gary Vee's energy.

CORE RULES:
1. KEEP THE CTA - The call-to-action stays the same
2. KEEP THE STRUCTURE - Hook → Body → CTA format
3. KEEP SIMILAR LENGTH - Within 20% of original
4. SOUND LIKE A REAL HUMAN - Casual, direct, conversational
5. BANNED WORDS: leverage, unlock, dive into, game-changing, elevate, empower, transform, utilize, implement, journey, delve

VIRAL PSYCHOLOGY TO APPLY:
- Pattern interrupts every 2-3 sentences (change pace, ask question, drop surprising fact)
- Open loops - hint at something coming, deliver later
- Specificity = believability (exact numbers, real examples)
- Emotional contrast (pain → solution → transformation)
- "You" is the most powerful word - use it constantly

${viralContext}

=== MANDATORY IMPROVEMENTS ===
${improvementInstructions.join('\n\n')}

BE BOLD. BE AGGRESSIVE. MAKE THIS SCRIPT IMPOSSIBLE TO SCROLL PAST.

Return ONLY the improved script. No explanations.`
          },
          {
            role: "user",
            content: `ORIGINAL SCRIPT TO TRANSFORM:

${script}

Apply ALL the improvements aggressively. Make this script 10x more viral.
Return ONLY the improved script.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.8, // Slightly higher for more creative rewrites
      });
      
      const boostedScript = response.choices[0]?.message?.content || script;
      
      // Calculate new metrics
      const newWords = boostedScript.split(/\s+/).filter(Boolean);
      const newSentences = boostedScript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const newAvgWordsPerSentence = newWords.length / Math.max(1, newSentences.length);
      const newGradeLevel = Math.max(3, Math.min(12, 0.39 * newAvgWordsPerSentence + 4));
      
      // Calculate new hook strength using the same scoring function
      const newFirstLine = boostedScript.split('\n')[0] || '';
      const newHookStrength = calculateHookStrength(newFirstLine);
      
      // Build suggestions list
      const suggestions = weakAreas.map(area => {
        switch(area) {
          case "reading_level": return { area: "Reading Level", issue: `Grade ${gradeLevel.toFixed(1)} is too high`, fix: "Simplified language to grade 3-5 level" };
          case "hook": return { area: "Hook Strength", issue: "Hook lacks pattern interrupts", fix: "Added stronger opening with proven viral patterns" };
          case "specificity": return { area: "Specificity", issue: "Not enough concrete details", fix: "Added specific numbers and examples" };
          case "engagement": return { area: "Engagement", issue: "Low audience connection words", fix: "Added more 'you/your' and curiosity gaps" };
          case "sentence_length": return { area: "Sentence Length", issue: `Avg ${avgWordsPerSentence.toFixed(0)} words per sentence`, fix: "Shortened to 5-8 words per sentence" };
          default: return { area: "General", issue: "Needs improvement", fix: "Applied viral optimization" };
        }
      });
      
      res.json({
        boostedScript,
        wordCount: newWords.length,
        gradeLevel: Math.round(newGradeLevel * 10) / 10,
        suggestions,
        improvements: {
          gradeLevelBefore: Math.round(gradeLevel * 10) / 10,
          gradeLevelAfter: Math.round(newGradeLevel * 10) / 10,
          hookStrengthBefore: hookStrength,
          hookStrengthAfter: newHookStrength,
          weakAreasFixed: weakAreas.length,
        }
      });
    } catch (error) {
      console.error("Error boosting script:", error);
      res.status(500).json({ error: "Failed to boost script virality" });
    }
  });

  // Competitor Research: Scrape top-performing TikTok content for a topic (Pro feature)
  app.post("/api/research/competitors", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { keyword, limit = 15 } = req.body;
      
      if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
        return res.status(400).json({ error: "Keyword is required" });
      }
      
      if (!process.env.APIFY_API_TOKEN) {
        return res.status(400).json({ error: "Apify API token not configured" });
      }
      
      console.log(`Starting competitor research for: ${keyword}`);
      
      // Import the Apify functions
      const { searchTikTokByKeyword, analyzeCompetitorContent } = await import("./apify");
      
      // Scrape TikTok for top content
      const searchResults = await searchTikTokByKeyword(keyword.trim(), Math.min(limit, 30));
      
      if (searchResults.posts.length === 0) {
        return res.json({
          insights: {
            topHooks: [],
            commonPatterns: [],
            audienceLanguage: [],
            provenAngles: [],
            engagementStats: { avgViews: 0, avgLikes: 0, avgComments: 0 },
            contentSummary: "No content found for this topic. Try a different keyword.",
          },
          postsAnalyzed: 0,
        });
      }
      
      // Analyze the scraped content
      const insights = analyzeCompetitorContent(searchResults.posts);
      
      res.json({
        insights,
        postsAnalyzed: searchResults.posts.length,
        topPosts: searchResults.posts.slice(0, 5).map(p => ({
          text: p.text.substring(0, 200) + (p.text.length > 200 ? "..." : ""),
          views: p.views,
          likes: p.likes,
          author: p.author,
        })),
      });
    } catch (error) {
      console.error("Error in competitor research:", error);
      res.status(500).json({ error: "Failed to research competitors" });
    }
  });

  // Deep Research: Expand raw topic into detailed brief (Pro feature)
  app.post("/api/scripts/expand-topic", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { topic, targetAudience, includeCompetitorResearch = false } = req.body;
      
      if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
        return res.status(400).json({ error: "Topic is required (at least 5 characters)" });
      }
      
      // Optional: Get competitor insights if requested and Apify is configured
      let competitorInsights = null;
      if (includeCompetitorResearch && process.env.APIFY_API_TOKEN) {
        try {
          console.log("Running competitor research for topic expansion...");
          const { searchTikTokByKeyword, analyzeCompetitorContent } = await import("./apify");
          const searchResults = await searchTikTokByKeyword(topic.trim(), 15);
          if (searchResults.posts.length > 0) {
            competitorInsights = analyzeCompetitorContent(searchResults.posts);
          }
        } catch (apifyError) {
          console.error("Competitor research failed (continuing without):", apifyError);
        }
      }
      
      // Build the system prompt with optional competitor data
      let systemPrompt = `You are a viral content strategist who helps creators turn raw ideas into powerful video scripts.

When given a raw/vague topic idea, expand it into a detailed video brief. Your job is to add specificity, unique angles, and actionable elements.`;

      if (competitorInsights && competitorInsights.topHooks.length > 0) {
        systemPrompt += `

COMPETITOR RESEARCH (from top-performing TikTok posts on this topic):
- Top hooks that worked: ${competitorInsights.topHooks.slice(0, 3).map(h => `"${h}"`).join(", ")}
- Avg engagement: ${competitorInsights.engagementStats.avgViews.toLocaleString()} views
- Common patterns: ${competitorInsights.commonPatterns.slice(0, 5).join(", ") || "N/A"}

Use these insights to inform your brief. What angles are competitors missing? How can we do better?`;
      }

      systemPrompt += `

Respond in JSON format with this exact structure:
{
  "coreMessage": "The ONE main point of this video (one sentence)",
  "targetViewer": "Who specifically needs to hear this and their current struggle",
  "uniqueAngle": "The unexpected twist or contrarian take that makes this stand out",
  "keyProofPoints": ["Stat/example 1", "Stat/example 2", "Stat/example 3"],
  "actionableTakeaway": "The ONE specific thing they can do in the next 5 minutes"
}

Make the proof points specific with numbers where possible. The unique angle should challenge common beliefs.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Expand this raw video idea into a detailed brief:

TOPIC: ${topic}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

Create a powerful video brief that will make this topic stand out and go viral.`
          }
        ],
        max_tokens: 600,
        temperature: 0.8,
      });
      
      const content = response.choices[0]?.message?.content || "";
      
      // Parse the JSON response
      try {
        const cleanedJson = content
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        
        const brief = JSON.parse(cleanedJson);
        
        res.json({
          expandedBrief: {
            coreMessage: brief.coreMessage || "Create value for your audience",
            targetViewer: brief.targetViewer || "Content creators looking to grow",
            uniqueAngle: brief.uniqueAngle || "A fresh perspective on the topic",
            keyProofPoints: Array.isArray(brief.keyProofPoints) 
              ? brief.keyProofPoints.slice(0, 3)
              : ["Point 1", "Point 2", "Point 3"],
            actionableTakeaway: brief.actionableTakeaway || "Take action today",
          },
          originalTopic: topic,
          competitorInsights: competitorInsights ? {
            topHooks: competitorInsights.topHooks.slice(0, 5),
            avgViews: competitorInsights.engagementStats.avgViews,
            avgLikes: competitorInsights.engagementStats.avgLikes,
            postsAnalyzed: competitorInsights.provenAngles.length,
          } : null,
        });
      } catch (parseError) {
        // Fallback if JSON parsing fails
        res.json({
          expandedBrief: {
            coreMessage: `Share powerful insights about ${topic}`,
            targetViewer: targetAudience || "People interested in this topic",
            uniqueAngle: "A perspective most people miss",
            keyProofPoints: [
              "Research shows this approach works",
              "Top performers do this differently",
              "Most people get this wrong"
            ],
            actionableTakeaway: "Apply one insight from this video today",
          },
          originalTopic: topic,
          competitorInsights: null,
        });
      }
    } catch (error) {
      console.error("Error expanding topic:", error);
      res.status(500).json({ error: "Failed to expand topic" });
    }
  });

  // ============================================
  // VIDEO CLONE FEATURE - Analyze video and extract structure
  // ============================================
  
  interface VideoStructureAnalysis {
    format: string;
    hookStyle?: string;
    pacing?: any;
    sections: Array<{
      name: string;
      description: string;
      durationPercent: number;
      sentenceCount?: number;
      avgWordsPerSentence?: number;
      exampleLine?: string;
      exampleLines?: string[];
      purpose?: string;
      emotionalTone?: string;
    }>;
    keyPatterns?: string[];
    toneDescription?: string;
    ctaStyle?: string;
    originalTranscript: string;
    sentenceStructure?: any;
    transitionPhrases?: string[];
    hookTemplate?: string;
    bodyTemplate?: string;
    ctaTemplate?: string;
    uniqueStyleNotes?: string;
    wordCount?: string | number;
    estimatedDurationSeconds?: number;
    wordsPerMinute?: number;
    audienceProfile?: string;
    hookAnalysis?: { style?: string; psychologyTrigger?: string; template?: string; openingLine?: string };
    toneProfile?: { energy?: string; vocabulary?: string; attitude?: string; personality?: string };
    emotionalArc?: string;
    retentionMechanics?: string[];
    powerWords?: string[];
    ctaAnalysis?: { style?: string; template?: string; exactLine?: string };
    visualCues?: string[];
    frames?: Array<{
      thumbnailUrl: string;
      timestamp: number;
      width?: number;
      height?: number;
    }>;
    coverImageUrl?: string;
  }
  
  app.post("/api/video-clone/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { videoUrl } = req.body;
      
      if (!videoUrl || typeof videoUrl !== 'string') {
        return res.status(400).json({ error: "Video URL is required" });
      }
      
      // Validate URL format before calling Apify
      const tiktokPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)/i;
      const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)/i;
      const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)/i;
      
      if (!tiktokPattern.test(videoUrl) && !instagramPattern.test(videoUrl) && !youtubePattern.test(videoUrl)) {
        return res.status(400).json({ 
          error: "Please enter a valid TikTok, Instagram, or YouTube video URL" 
        });
      }
      
      // Check if Apify is configured
      if (!process.env.APIFY_API_TOKEN) {
        return res.status(400).json({ error: "Video analysis is not available. Contact support." });
      }
      
      console.log("[Video Clone] Analyzing video:", videoUrl);
      
      // Step 1: Extract transcript from the video
      const videoData = await extractVideoTranscript(videoUrl);
      
      if (!videoData.success || !videoData.transcript) {
        return res.status(400).json({ 
          error: videoData.error || "Could not extract transcript from video. Make sure the URL is a valid TikTok or Instagram video." 
        });
      }

      const transcriptWordCount = videoData.transcript.split(/\s+/).filter(Boolean).length;
      if (transcriptWordCount < 12) {
        return res.status(400).json({
          error: "This video does not have enough usable spoken transcript to clone well. Try a video with clear speech or captions.",
        });
      }
      
      console.log("[Video Clone] Transcript extracted, length:", videoData.transcript.length);
      console.log("[Video Clone] Video download URL:", videoData.videoDownloadUrl ? "available" : "not available");
      
      // Step 2: Run frame extraction in parallel with AI analysis (if video URL available)
      const frameExtractionPromise = videoData.videoDownloadUrl 
        ? extractVideoFrames(videoData.videoDownloadUrl, 5, videoData.duration)
            .catch(err => {
              console.error("[Video Clone] Frame extraction failed (non-blocking):", err);
              return { frames: [] as ExtractedFrame[], error: "Frame extraction failed" };
            })
        : Promise.resolve({ frames: [] as ExtractedFrame[], error: "No video download URL available" });
      
      // Step 3: Use AI to deeply analyze the video structure for format cloning
      const analysisPrompt = `You are an elite video format reverse-engineer. Your job is to deconstruct a video so precisely that a different creator could replicate its EXACT format, rhythm, psychology, and feel with completely different content.

    VIDEO METADATA:
    - Platform: ${videoData.platform}
    - Author: ${videoData.author || "unknown"}
    - Views: ${videoData.views || 0}
    - Likes: ${videoData.likes || 0}
    - Comments: ${videoData.comments || 0}
    - Duration: ${videoData.duration || 0} seconds
    - Transcript word count: ${transcriptWordCount}

TRANSCRIPT:
"${videoData.transcript}"

Analyze this at THREE levels:
1. STRUCTURAL — sections, flow, timing
2. LINGUISTIC — sentence patterns, word choices, rhetorical devices
3. PSYCHOLOGICAL — why this format works, what keeps viewers watching

Return a JSON object:

{
  "format": "Video format type (e.g., 'talking_head', 'duet', 'story_time', 'listicle', 'tutorial', 'reaction', 'text_on_screen', 'hybrid_[types]')",

  "estimatedDurationSeconds": 0,
  "wordCount": 0,
  "wordsPerMinute": 0,

  "audienceProfile": "Who this video is speaking to — their identity, pain point, and desire in one sentence",

  "hookAnalysis": {
    "style": "e.g., 'question', 'bold_statement', 'curiosity_gap', 'direct_address', 'statistic', 'pattern_interrupt', 'controversial_claim'",
    "psychologyTrigger": "The specific psychological lever pulled (e.g., 'fear of missing out', 'identity challenge', 'unexpected contradiction', 'social proof shock')",
    "template": "Fill-in-the-blank version. e.g., 'Stop [doing X] if you want to [achieve Y]'",
    "openingLine": "The exact first line verbatim"
  },

  "sections": [
    {
      "name": "Section name (e.g., 'Hook', 'Problem Agitation', 'Authority Bridge', 'Core Content', 'Reframe', 'CTA')",
      "purpose": "What this section DOES psychologically (e.g., 'creates urgency', 'establishes credibility', 'triggers curiosity loop')",
      "description": "What happens AND the rhetorical technique used",
      "durationPercent": 15,
      "sentenceCount": 2,
      "avgWordsPerSentence": 8,
      "exampleLines": ["Copy 1-2 actual lines from this section verbatim as style reference"],
      "emotionalTone": "The emotional register of THIS section (e.g., 'confrontational', 'empathetic', 'excited', 'conspiratorial')"
    }
  ],

  "emotionalArc": "Map the emotional journey. e.g., 'Shock → Empathy → Authority → Hope → Urgency' or 'Curiosity → Frustration → Relief → Excitement'",

  "retentionMechanics": ["SPECIFIC techniques keeping viewers watching. e.g., 'Open loop in first 3 seconds resolved at end', 'Pattern interrupt every 15 seconds with a contradicting statement', 'Stacks benefits using the phrase And it gets better', 'Uses direct address (you/your) every 2-3 sentences to maintain personal stakes'"],

  "pacing": {
    "overall": "e.g., 'fast_cuts', 'conversational', 'dramatic_pauses', 'energetic', 'building_intensity'",
    "sentenceRhythm": "Describe the cadence pattern. e.g., 'Short-short-long. Punchy fragments followed by one flowing explanation sentence. Then reset.'",
    "pausePattern": "Where and how pauses are used. e.g., 'Pauses after bold claims for emphasis', 'No pauses — rapid-fire delivery throughout'"
  },

  "toneProfile": {
    "energy": "1-10 scale with description (e.g., '7 — high energy but controlled, like a confident friend sharing insider info')",
    "vocabulary": "Vocabulary level and style (e.g., 'Simple, 6th-grade reading level. Uses slang like lowkey, vibe. Zero jargon.')",
    "attitude": "The creator's attitude toward the audience (e.g., 'Peer giving tough love', 'Expert simplifying for beginners', 'Insider sharing secrets')",
    "personality": "Distinctive voice traits (e.g., 'Self-deprecating humor mixed with authority', 'Blunt and unapologetic', 'Warm but no-nonsense')"
  },

  "sentenceStructure": {
    "dominantType": "e.g., 'Fragments and imperatives', 'Full conversational sentences', 'Mix of questions and declarations'",
    "avgLength": "Average words per sentence",
    "pattern": "Describe the repeating sentence pattern. e.g., 'Statement. Statement. Question? Answer fragment. Expansion sentence.'"
  },

  "transitionPhrases": ["List EVERY transition phrase used between sections verbatim. e.g., 'But here is what nobody tells you', 'And the crazy part is', 'So here is what you do', 'Now watch this'"],

  "powerWords": ["List distinctive or repeated power words/phrases. e.g., 'literally', 'nobody is talking about', 'the truth is'"],

  "bodyTemplate": "Describe the body structure as a replicable template. e.g., 'Problem statement → Incorrect common solution → Why it fails (with specific example) → Correct approach → Proof/result → Repeat for 2nd point'",

  "ctaAnalysis": {
    "style": "e.g., 'soft_ask', 'direct_command', 'question', 'value_exchange', 'curiosity_cliffhanger', 'none'",
    "template": "Fill-in-the-blank. e.g., 'Comment [word] if you want [thing]' or 'Follow for more [topic] that [benefit]'",
    "exactLine": "The actual CTA line verbatim"
  },

  "visualCues": ["Any visual or editing cues inferred from the transcript. e.g., 'Likely uses text overlay for statistics', 'Enumerated list suggests on-screen numbering', 'Direct-to-camera based on first-person direct address'"],

  "uniqueStyleNotes": "Distinctive stylistic choices that make this creator's format recognizable: repetition patterns, callbacks, humor type, catchphrases, rhetorical devices, emphasis techniques, anything a viewer would recognize as THIS creator's style"
}

Be surgically precise. Every field should contain enough detail that someone could recreate this EXACT format — same feel, same rhythm, same psychology — with completely different content.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert video format reverse-engineer. Extract every structural detail so the format can be precisely replicated with different content. Return ONLY valid JSON." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });
      
      const analysisText = response.choices[0].message.content?.trim() || "{}";
      
      // Parse the JSON response
      let analysis: any;
      try {
        const cleanJson = analysisText.replace(/```json\n?|\n?```/g, '').trim();
        analysis = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("[Video Clone] Failed to parse AI analysis:", parseError);
        return res.status(500).json({ error: "Failed to analyze video structure" });
      }
      
      const structureAnalysis: VideoStructureAnalysis = {
        format: analysis.format || "talking_head",
        originalTranscript: videoData.transcript,
        sections: analysis.sections || [],
        // New rich fields from improved analysis prompt
        estimatedDurationSeconds: analysis.estimatedDurationSeconds,
        wordCount: analysis.wordCount,
        wordsPerMinute: analysis.wordsPerMinute,
        audienceProfile: analysis.audienceProfile || "",
        hookAnalysis: analysis.hookAnalysis || undefined,
        emotionalArc: analysis.emotionalArc || "",
        retentionMechanics: analysis.retentionMechanics || [],
        pacing: analysis.pacing || "conversational",
        toneProfile: analysis.toneProfile || undefined,
        sentenceStructure: analysis.sentenceStructure || "",
        transitionPhrases: analysis.transitionPhrases || [],
        powerWords: analysis.powerWords || [],
        bodyTemplate: analysis.bodyTemplate || "",
        ctaAnalysis: analysis.ctaAnalysis || undefined,
        visualCues: analysis.visualCues || [],
        uniqueStyleNotes: analysis.uniqueStyleNotes || "",
        // Legacy fields for backward compatibility with UI
        hookStyle: analysis.hookAnalysis?.style || analysis.hookStyle || "direct_address",
        toneDescription: analysis.toneProfile?.attitude || analysis.toneDescription || "",
        ctaStyle: analysis.ctaAnalysis?.style || analysis.ctaStyle || "soft_ask",
        keyPatterns: analysis.keyPatterns || [],
        hookTemplate: analysis.hookAnalysis?.template || analysis.hookTemplate || "",
        ctaTemplate: analysis.ctaAnalysis?.template || analysis.ctaTemplate || "",
      };
      
      console.log("[Video Clone] Analysis complete:", structureAnalysis.format, structureAnalysis.sections.length, "sections");
      
      // Wait for frame extraction to complete (runs in parallel with AI analysis)
      const frameResult = await frameExtractionPromise;
      if (frameResult.frames.length > 0) {
        structureAnalysis.frames = frameResult.frames;
        console.log("[Video Clone] Frames attached:", frameResult.frames.length);
      } else {
        console.log("[Video Clone] No frames extracted:", frameResult.error || "unknown reason");
      }
      
      // Attach cover image if available
      if (videoData.coverImageUrl) {
        structureAnalysis.coverImageUrl = videoData.coverImageUrl;
        console.log("[Video Clone] Cover image attached:", videoData.coverImageUrl.substring(0, 80) + "...");
      } else {
        console.log("[Video Clone] No cover image available from video data");
      }
      
      res.json({
        success: true,
        platform: videoData.platform,
        author: videoData.author,
        views: videoData.views,
        likes: videoData.likes,
        duration: videoData.duration,
        transcript: videoData.transcript,
        analysis: structureAnalysis,
      });
      
    } catch (error: any) {
      console.error("[Video Clone] Error analyzing video:", error);
      res.status(500).json({ error: "Failed to analyze video. Please try again." });
    }
  });

  app.get("/api/image-proxy", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: "URL parameter required" });
      }

      const allowedDomains = [
        "tiktokcdn.com", "tiktokcdn-us.com", "tiktok.com",
        "cdninstagram.com", "instagram.com", "fbcdn.net",
        "ytimg.com", "youtube.com", "ggpht.com",
        "apifyusercontent.com", "apify.com",
        "pexels.com", "unsplash.com",
      ];

      const urlObj = new URL(imageUrl);
      const isAllowed = allowedDomains.some(d => urlObj.hostname.endsWith(d));
      if (!isAllowed) {
        return res.status(403).json({ error: "Domain not allowed" });
      }

      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "image/*,*/*",
          "Referer": urlObj.origin,
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error: any) {
      console.error("[Image Proxy] Error:", error.message);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Generate Content Skeleton for Deep Research Mode
  app.post("/api/scripts/generate-skeleton", async (req, res) => {
    try {
      const { topic, targetAudience, includeCompetitorResearch = false, viralExamples } = req.body;
      
      if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
        return res.status(400).json({ error: "Topic is required (at least 5 characters)" });
      }
      
      // Research real creators and working strategies
      let creatorResearch: any = null;
      let creatorDataForPrompt = "";
      let viralExamplesPrompt = "";
      let ap5InsightsPrompt = "";
      
      // Fetch AP5 strategic insights if Apify is configured
      if (process.env.APIFY_API_TOKEN) {
        try {
          const { fetchAP5Insights } = await import("./apify");
          const ap5Data = await fetchAP5Insights(topic.trim(), { limit: 20 });
          
          if (ap5Data && ap5Data.researchDepth !== "basic") {
            ap5InsightsPrompt = `
=== STRATEGIC INSIGHTS (from AP5 Social Media Monitoring) ===

KEY INSIGHTS FROM TOP CONTENT:
${ap5Data.keyInsights.slice(0, 5).map((insight, i) => `${i + 1}. "${insight}"`).join('\n')}

PAIN POINTS YOUR AUDIENCE HAS:
${ap5Data.painPoints.slice(0, 5).map(pain => `- ${pain}`).join('\n')}

EMOTIONAL DRIVERS (what makes them engage):
${ap5Data.emotionalDrivers.slice(0, 5).map(em => `- ${em}`).join('\n')}

PROVEN CTA IDEAS (that work on this topic):
${ap5Data.provenCTAIdeas.slice(0, 5).map(cta => `- ${cta}`).join('\n')}

OBJECTION CRUSHERS (how top creators handle doubts):
${ap5Data.objectionCrushers.slice(0, 5).map(obj => `- ${obj}`).join('\n')}

SWIPEABLE FACTS/STATS:
${ap5Data.swipeableFacts.slice(0, 5).map(fact => `- ${fact}`).join('\n')}

CONTENT ANGLES THAT WORK:
${ap5Data.contentAngles.slice(0, 5).map(angle => `- "${angle}"`).join('\n')}

Research Summary: ${ap5Data.topicSummary}
=== END STRATEGIC INSIGHTS ===
`;
          }
        } catch (ap5Error) {
          console.error("AP5 insights fetch failed (continuing without):", ap5Error);
        }
      }
      
      // If viral examples are provided, use them to enhance the prompt
      if (viralExamples && Array.isArray(viralExamples.examples) && viralExamples.examples.length > 0) {
        viralExamplesPrompt = `
=== VIRAL EXAMPLES (Real TikTok captions that went viral on this topic) ===

PERFORMANCE INSIGHTS:
- Average Views: ${viralExamples.avgViews >= 1000000 ? `${(viralExamples.avgViews / 1000000).toFixed(1)}M` : `${Math.round(viralExamples.avgViews / 1000)}K`}
- Average Engagement: ${viralExamples.avgEngagement}%
- Best Performing Duration: ${viralExamples.bestPerformingDuration}
- Top Formats: ${viralExamples.dominantFormats?.join(', ') || 'Mixed'}
- Top Hook Types: ${viralExamples.dominantHookTypes?.join(', ') || 'Various'}

TOP VIRAL CAPTIONS (study these patterns):
${viralExamples.examples.slice(0, 5).map((ex: any, i: number) => `
${i + 1}. @${ex.author} (${Math.round(ex.views / 1000)}K views, ${ex.engagementRate}% engagement)
   Hook Type: ${ex.hookType} | Format: ${ex.formatType}
   Caption: "${ex.fullCaption}"
`).join('')}

USE THESE PATTERNS:
- Study the hook styles that got views
- Match the caption length and format
- Emulate the engagement patterns
=== END VIRAL EXAMPLES ===
`;
      }
      
      if (includeCompetitorResearch && process.env.APIFY_API_TOKEN) {
        try {
          const { researchGrowingCreators } = await import("./apify");
          creatorResearch = await researchGrowingCreators(topic.trim(), 20);
          
          if (creatorResearch.growingCreators.length > 0) {
            const topCreators = creatorResearch.growingCreators.slice(0, 10);
            creatorDataForPrompt = `
=== REAL CREATOR RESEARCH DATA (Use these examples) ===

TOP PERFORMING CREATORS ON THIS TOPIC:
${topCreators.map((c: any, i: number) => `${i + 1}. @${c.username} - ${(c.views / 1000).toFixed(0)}K views, ${c.engagementRate}% engagement
   Hook: "${c.contentSample.split(/[\n.!?]/)[0]?.slice(0, 80) || 'N/A'}..."
   ${c.tacticsUsed.length > 0 ? `Tactics: ${c.tacticsUsed.join(', ')}` : ''}
   ${c.toolsMentioned.length > 0 ? `Tools: ${c.toolsMentioned.join(', ')}` : ''}`).join('\n')}

WORKING STRATEGIES (from top creators):
${creatorResearch.workingStrategies.length > 0 ? creatorResearch.workingStrategies.map((s: string) => `- ${s}`).join('\n') : '- Analyze what makes their content work'}

TOOLS & AUTOMATIONS BEING USED:
${creatorResearch.toolsAndAutomations.length > 0 ? creatorResearch.toolsAndAutomations.map((t: string) => `- ${t}`).join('\n') : '- Research common tools in this niche'}

TRENDING HOOK ANGLES:
${creatorResearch.trendingAngles.slice(0, 5).map((a: string) => `- "${a}"`).join('\n')}

AVG ENGAGEMENT RATE: ${creatorResearch.avgEngagement}%
=== END RESEARCH DATA ===`;
          }
        } catch (apifyError) {
          console.error("Creator research failed:", apifyError);
        }
      }
      
      const systemPrompt = `You are an expert viral content strategist. Your job is to create SPECIFIC, DATA-DRIVEN content skeletons that reference REAL creators and working tactics.

${ap5InsightsPrompt}
${viralExamplesPrompt}
${creatorDataForPrompt}

CRITICAL RULES:
1. NEVER use generic stats like "1 billion monthly users" or "X% of people"
2. ALWAYS reference specific creators (use @username format) from the research
3. ALWAYS mention specific tools, automations, or tactics that are working NOW
4. Facts must be ACTIONABLE - "Creator @xyz gained 50K followers using ManyChat automation" NOT "social media is growing"
5. Every research fact must include a specific creator example OR a specific tactic with numbers

Respond with a JSON object in this EXACT format:
{
  "topicSummary": "One clear sentence about what this video teaches",
  "targetAudience": "Specific person who needs this (e.g., 'coaches with 1-10K followers wanting to monetize')",
  "uniqueAngle": "The contrarian/unexpected perspective - what most creators get WRONG",
  "sections": [
    {
      "id": "section_1",
      "title": "Hook - Pattern Interrupt",
      "objective": "Stop the scroll with something unexpected",
      "keyMoments": ["Specific controversial or curiosity-gap statement", "Reference to what's working NOW"],
      "suggestedDuration": "0:00-0:05"
    },
    {
      "id": "section_2", 
      "title": "The Problem/Mistake",
      "objective": "Show what most people do wrong",
      "keyMoments": ["Common mistake with specific example", "Why this fails (with data)"],
      "suggestedDuration": "0:05-0:15"
    },
    {
      "id": "section_3",
      "title": "The Strategy That Works",
      "objective": "Reveal the working approach with proof",
      "keyMoments": ["Specific tactic/tool with creator example", "Step-by-step breakdown", "Expected results"],
      "suggestedDuration": "0:15-0:35"
    },
    {
      "id": "section_4",
      "title": "Call to Action",
      "objective": "Drive immediate action",
      "keyMoments": ["Clear next step", "Urgency element"],
      "suggestedDuration": "0:35-0:45"
    }
  ],
  "researchFacts": [
    {"id": "fact_1", "fact": "@creatorname gained X followers in 30 days using [specific tactic]", "source": "TikTok research", "credibility": "high"},
    {"id": "fact_2", "fact": "Creators using [tool] see X% higher engagement than those who don't", "source": "Platform data", "credibility": "high"},
    {"id": "fact_3", "fact": "[Specific tactic] is working NOW - top 10 creators all use it", "source": "Current trends", "credibility": "high"},
    {"id": "fact_4", "fact": "The #1 mistake: [specific thing] - only X% of creators avoid it", "source": "Content analysis", "credibility": "medium"}
  ],
  "suggestedHooks": [
    "Hook referencing a specific creator's success",
    "Hook challenging what everyone thinks is true",
    "Hook with a specific number or timeframe"
  ],
  "workingTactics": ["Tactic 1 with tool name", "Tactic 2 with specific approach"],
  "toolsToMention": ["Tool 1", "Tool 2"]
}

BANNED CONTENT (NEVER include):
- Generic platform stats (X billion users, X% growth)
- Vague claims without creator examples
- "Studies show" without specific source
- Placeholder facts you made up
- Generic advice like "post consistently"

IF YOU DON'T HAVE REAL DATA: Be honest and say "Research needed" rather than making up fake stats.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Create a data-driven content skeleton for this video topic:

TOPIC: ${topic}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

Requirements:
1. Include at least 4 research facts with SPECIFIC creator examples or tactics
2. Each section must have 2-3 specific key moments (not vague)
3. Suggest hooks that reference real data or creators
4. List specific tools/automations that are working NOW

DO NOT make up fake statistics. Use the research data provided, or clearly state when more research is needed.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      
      const content = response.choices[0]?.message?.content || "";
      
      try {
        const cleanedJson = content
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        
        const skeleton = JSON.parse(cleanedJson);
        
        // Validate that we have real data, not generic stats
        const bannedPatterns = [
          /\d+\s*(billion|million)\s*(users|people|monthly)/i,
          /studies show/i,
          /research (shows|indicates)/i,
          /according to (studies|research)/i,
        ];
        
        // Filter out any generic facts
        const validFacts = (skeleton.researchFacts || []).filter((f: any) => {
          const factText = f.fact || "";
          return !bannedPatterns.some(p => p.test(factText));
        });
        
        // Normalize the response
        const normalizedSkeleton = {
          topicSummary: skeleton.topicSummary || topic,
          targetAudience: skeleton.targetAudience || targetAudience || "Creators who want real results",
          uniqueAngle: skeleton.uniqueAngle || "A contrarian take that challenges common wisdom",
          sections: (skeleton.sections || []).map((s: any, i: number) => ({
            id: s.id || `section_${i + 1}`,
            title: s.title || `Section ${i + 1}`,
            objective: s.objective || "Deliver value",
            keyMoments: Array.isArray(s.keyMoments) ? s.keyMoments.filter((m: string) => m && m.length > 5) : [],
            suggestedDuration: s.suggestedDuration || "0:00-0:15",
          })),
          researchFacts: validFacts.slice(0, 6).map((f: any, i: number) => ({
            id: f.id || `fact_${i + 1}`,
            fact: f.fact || "Research needed",
            source: f.source || "Needs verification",
            credibility: f.credibility || "medium",
            isUsed: true,
          })),
          competitorInsights: creatorResearch ? {
            topCreators: creatorResearch.growingCreators.slice(0, 5).map((c: any) => ({
              username: c.username,
              views: c.views,
              engagementRate: c.engagementRate,
              tactics: c.tacticsUsed,
              tools: c.toolsMentioned,
            })),
            workingStrategies: creatorResearch.workingStrategies,
            toolsAndAutomations: creatorResearch.toolsAndAutomations,
          } : undefined,
          suggestedHooks: Array.isArray(skeleton.suggestedHooks) ? skeleton.suggestedHooks : [],
          workingTactics: skeleton.workingTactics || [],
          toolsToMention: skeleton.toolsToMention || creatorResearch?.toolsAndAutomations || [],
          isLocked: false,
        };
        
        res.json({ skeleton: normalizedSkeleton, originalTopic: topic });
      } catch (parseError) {
        console.error("Failed to parse skeleton JSON:", parseError);
        res.json({
          skeleton: {
            topicSummary: topic,
            targetAudience: targetAudience || "Your ideal viewer",
            uniqueAngle: "Research specific creators to find your unique angle",
            sections: [
              { id: "section_1", title: "Hook", objective: "Stop the scroll", keyMoments: ["Research trending hooks in your niche"], suggestedDuration: "0:00-0:05" },
              { id: "section_2", title: "Problem", objective: "Show the mistake", keyMoments: ["Find what top creators say people do wrong"], suggestedDuration: "0:05-0:15" },
              { id: "section_3", title: "Solution", objective: "Reveal the tactic", keyMoments: ["Reference a specific working strategy"], suggestedDuration: "0:15-0:35" },
              { id: "section_4", title: "CTA", objective: "Drive action", keyMoments: ["Clear next step"], suggestedDuration: "0:35-0:45" },
            ],
            researchFacts: [
              { id: "fact_1", fact: "Research needed - enable competitor research for real data", source: "Enable Apify", credibility: "low", isUsed: true }
            ],
            suggestedHooks: ["Enable competitor research to get real hook examples"],
            isLocked: false,
          },
          originalTopic: topic,
        });
      }
    } catch (error) {
      console.error("Error generating skeleton:", error);
      res.status(500).json({ error: "Failed to generate content skeleton" });
    }
  });

  app.get("/api/scripts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const scripts = await storage.getScripts(userId);
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  app.get("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const script = await storage.getScript(req.params.id, userId);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch script" });
    }
  });

  // Update script content - used for saving edits which improves Script Memory
  app.patch("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { script: scriptContent, title } = req.body;
      if (!scriptContent && !title) {
        return res.status(400).json({ error: "No updates provided" });
      }
      
      const updates: any = {};
      if (scriptContent) {
        updates.script = scriptContent;
        // Recalculate word count
        updates.wordCount = scriptContent.split(/\s+/).filter((w: string) => w.length > 0).length;
      }
      if (title) {
        updates.title = title;
      }
      
      const updated = await storage.updateScript(req.params.id, updates, userId);
      if (!updated) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      // Clear style analysis cache so Script Memory picks up edits
      if (styleCache.has(userId)) {
        styleCache.delete(userId);
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating script:", error);
      res.status(500).json({ error: "Failed to update script" });
    }
  });

  app.delete("/api/scripts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const deleted = await storage.deleteScript(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  // Send script via email - Resend integration
  app.post("/api/scripts/:id/email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const script = await storage.getScript(req.params.id, userId);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      const userEmail = req.user?.email || req.user?.username;
      if (!userEmail) {
        return res.status(400).json({ error: "No email address available" });
      }
      
      const { sendScriptEmail } = await import("./resend");
      await sendScriptEmail(userEmail, script.title || 'Your Script', script.script);
      
      res.json({ success: true, message: "Script sent to your email" });
    } catch (error) {
      console.error("Error sending script email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const project = await storage.createProject({ userId, name, description });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const deleted = await storage.deleteProject(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.post("/api/projects/scripts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { projectId, scriptId } = req.body;
      if (!scriptId) {
        return res.status(400).json({ error: "Script ID is required" });
      }
      
      const script = await storage.getScript(scriptId, userId);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      await storage.addScriptToProject(projectId, scriptId, userId);
      res.json({ success: true, message: "Script added to project" });
    } catch (error) {
      res.status(500).json({ error: "Failed to add script to project" });
    }
  });

  app.get("/api/vault", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const items = await storage.getVaultItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vault items" });
    }
  });

  app.post("/api/vault", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { scriptId, name } = req.body;
      if (!scriptId || !name) {
        return res.status(400).json({ error: "Script ID and name are required" });
      }
      const item = await storage.createVaultItem({ userId, scriptId, name });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to save to vault" });
    }
  });

  app.delete("/api/vault/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const deleted = await storage.deleteVaultItem(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Vault item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vault item" });
    }
  });

  app.get("/api/hooks", (req, res) => {
    res.json(viralHooks);
  });

  app.get("/api/script-templates", (_req, res) => {
    res.json({ templates: viralStyleTemplates, count: viralStyleTemplates.length });
  });

  // Generate multiple hook options based on style and content
  app.post("/api/hooks/generate", async (req, res) => {
    try {
      const { hookStyle, problem, solution, targetAudience, platform, duration, videoPurpose } = req.body;
      
      if (!hookStyle || (!problem && !solution)) {
        return res.status(400).json({ error: "Hook style and at least problem or solution content required" });
      }

      // Find the hook category info
      const hookCategory = hookCategories.find(c => c.id === hookStyle);
      const hookExamples = viralHooks.filter(h => h.category === hookStyle).slice(0, 3);
      
      // Video purpose context
      const purposeContext: Record<string, string> = {
        authority: "This is an AUTHORITY video - the creator is establishing expertise with a bold opinion or unique insight",
        education: "This is an EDUCATION video - the creator is teaching something valuable to help viewers learn",
        storytelling: "This is a STORYTELLING video - the creator is sharing a personal experience to connect emotionally",
      };
      
      const systemPrompt = `You are an expert at writing CONVERSATIONAL video hooks that sound like someone is actually TALKING to the viewer, not reading a title or headline.

CRITICAL: Your hooks must sound SPOKEN, not written. They should feel like:
- A friend grabbing your attention in a conversation
- Someone starting a voice memo to you
- The first thing someone says when they sit down next to you

AVOID hooks that sound like:
- Article headlines or blog post titles
- Marketing copy or ad slogans
- Cheat sheet titles or course names
- Formal or written language

${videoPurpose ? purposeContext[videoPurpose] || '' : ''}

HOOK STYLE: ${hookCategory?.name || hookStyle}
STYLE DESCRIPTION: ${hookCategory?.description || "Create engaging hooks"}

CONVERSATIONAL HOOK EXAMPLES (notice how they sound SPOKEN):
- "If you're still using ChatGPT or Gemini, you are lost as a founder. Try these tools instead."
- "I lost $50K following this 'expert' advice - here's what I wish I knew."
- "Okay so I tested this AI tool for 30 days and honestly? I'm a little freaked out."
- "Stop. If you're about to post a reel, you need to hear this first."
- "I'm going to tell you something your marketing coach won't."

${hookExamples.length > 0 ? `STYLE-SPECIFIC EXAMPLES:
${hookExamples.map((h, i) => `${i + 1}. Template: "${h.template}"\n   Example: "${h.example}"`).join('\n\n')}` : ''}

RULES:
1. Hooks must sound CONVERSATIONAL - like someone is TALKING directly to the viewer
2. Use contractions (you're, I'm, don't, can't, won't, here's)
3. Use casual speech patterns ("Okay so...", "Look,", "Here's the thing...", "I'm going to...")
4. Maximum 1-2 sentences (under 20 words ideally)
5. Create curiosity, tension, or a reason to keep watching
6. Make it SPECIFIC to the problem/solution - not generic
7. Vary the approach - give 5 distinctly different conversational hooks
8. Consider the platform (${platform || 'TikTok'}) - shorter for TikTok, can be slightly longer for YouTube
9. Score each hook from 1-100 based on scroll-stopping strength, clarity, and specificity

Respond with a JSON array of exactly 5 hooks:
[
  {"hook": "The conversational hook text", "reasoning": "Why this grabs attention and sounds spoken", "score": 92},
  {"hook": "Another option", "reasoning": "Explanation", "score": 88},
  {"hook": "Third option", "reasoning": "Explanation", "score": 84},
  {"hook": "Fourth option", "reasoning": "Explanation", "score": 79},
  {"hook": "Fifth option", "reasoning": "Explanation", "score": 75}
]`;

      const userPrompt = `Generate 5 CONVERSATIONAL hooks for this video:

VIDEO TYPE: ${videoPurpose || 'education'}
PROBLEM the video addresses: ${problem || 'Not specified'}
SOLUTION/TEACHING the video offers: ${solution || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'General creators'}
PLATFORM: ${platform || 'TikTok'}
DURATION: ${duration || '60s'}

Create 5 distinctly different hooks in the "${hookCategory?.name || hookStyle}" style. 
Remember: Each hook should sound like someone TALKING to the viewer, not a written title or headline.
Start with words like: "If you're...", "Okay so...", "Look,", "I'm going to...", "Stop.", "Here's the thing...", etc.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.9, // Higher temp for more variety
      });

      const content = response.choices[0]?.message?.content || "[]";
      
      try {
        const cleanedJson = content
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        
        const hooks = JSON.parse(cleanedJson);
        
        // Validate and normalize
        const normalizedHooks = (Array.isArray(hooks) ? hooks : []).slice(0, 5).map((h: any, i: number) => ({
          id: `hook_${i + 1}`,
          hook: h.hook || h.text || `Hook option ${i + 1}`,
          reasoning: h.reasoning || h.why || "AI-generated hook",
          score: typeof h.score === 'number' ? Math.max(1, Math.min(100, Math.round(h.score))) : Math.max(60, 92 - (i * 6)),
          style: hookStyle,
        }));
        
        res.json({ 
          hooks: normalizedHooks,
          style: hookStyle,
          styleName: hookCategory?.name || hookStyle,
        });
      } catch (parseError) {
        console.error("Failed to parse hook generation response:", parseError);
        res.status(500).json({ error: "Failed to parse generated hooks" });
      }
    } catch (error: any) {
      console.error("Hook generation error:", error);
      const errorDetails = {
        message: error?.message || "Unknown error",
        status: error?.status,
        code: error?.code,
        type: error?.type,
        cause: error?.cause?.message,
        baseURL: openaiBaseURL,
        hasApiKey: hasOwnOpenAIKey,
        isProduction: isProductionDeployment,
      };
      console.error("Hook generation error details:", JSON.stringify(errorDetails, null, 2));
      
      const isConnectionError = error?.message?.includes('ECONNREFUSED') || 
                                error?.message?.includes('fetch failed') ||
                                error?.code === 'ECONNREFUSED';
      
      if (isConnectionError) {
        res.status(500).json({ 
          error: "AI service temporarily unavailable. Please try again.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      } else {
        res.status(500).json({ 
          error: "Failed to generate hooks. Please try again.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      }
    }
  });

  // Adapt a viral hook template to the user's specific problem/solution context
  app.post("/api/hooks/adapt", async (req, res) => {
    try {
      const { hookTemplate, hookName, problem, solution, targetAudience, videoPurpose } = req.body;
      
      if (!hookTemplate || (!problem && !solution)) {
        return res.status(400).json({ error: "Hook template and problem or solution content required" });
      }

      // Video purpose context
      const purposeContext: Record<string, string> = {
        authority: "This is an AUTHORITY video - adapt the hook to sound bold and opinionated",
        education: "This is an EDUCATION video - adapt the hook to promise valuable teaching",
        storytelling: "This is a STORYTELLING video - adapt the hook to hint at a personal experience",
      };

      const systemPrompt = `You are an expert at adapting viral hook templates to specific content.

Your job: Take a generic hook template and transform it to perfectly match the user's specific problem and solution.

CRITICAL RULES:
1. KEEP the SAME HOOK STYLE and STRUCTURE - just fill in the specifics
2. Make it sound CONVERSATIONAL and SPOKEN, not like a headline
3. The adapted hook must directly relate to the problem/solution provided
4. Maximum 1-2 sentences (under 25 words ideally)
5. Use contractions (you're, I'm, don't, here's, etc.)
6. The hook should create curiosity about the SPECIFIC solution
${videoPurpose ? `\n${purposeContext[videoPurpose] || ''}` : ''}

EXAMPLE:
Template: "I used to [painful thing everyone relates to]"
Problem: "Founders struggle with imposter syndrome"
Solution: "Using a daily confidence journal"
Adapted: "I used to feel like a complete fraud every time I pitched to investors."

Another EXAMPLE:
Template: "Here's 5 things wrong with [something]"
Problem: "People waste money on marketing that doesn't convert"
Solution: "The 3-step validation framework before spending on ads"
Adapted: "Here's 5 things wrong with how you're spending your marketing budget."

Return ONLY the adapted hook text. No explanations, no quotes, just the hook.`;

      const userPrompt = `HOOK TEMPLATE: "${hookTemplate}"
HOOK NAME: ${hookName || 'Unknown'}
PROBLEM: ${problem || 'Not specified'}
SOLUTION/CORE TEACHING: ${solution || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'General creators'}
VIDEO PURPOSE: ${videoPurpose || 'education'}

Adapt this hook template to match the specific problem and solution above. Return ONLY the adapted hook text.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const adaptedHook = response.choices[0]?.message?.content?.trim() || hookTemplate;
      
      // Clean up any quotes that might wrap the response
      const cleanedHook = adaptedHook.replace(/^["']|["']$/g, '').trim();
      
      res.json({ 
        adaptedHook: cleanedHook,
        originalTemplate: hookTemplate,
        hookName: hookName,
      });
    } catch (error: any) {
      console.error("Hook adaptation error:", error);
      const errorDetails = {
        message: error?.message || "Unknown error",
        status: error?.status,
        code: error?.code,
        baseURL: openaiBaseURL,
        hasApiKey: hasOwnOpenAIKey,
        isProduction: isProductionDeployment,
      };
      console.error("Hook adaptation error details:", JSON.stringify(errorDetails, null, 2));
      res.status(500).json({ 
        error: "Failed to adapt hook. Please try again.",
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      });
    }
  });

  // Generate solution suggestions based on problem
  app.post("/api/solutions/generate", async (req, res) => {
    console.log("Solution generation request received:", { 
      problem: req.body?.problem?.substring(0, 50),
      targetAudience: req.body?.targetAudience,
      platform: req.body?.platform,
      videoPurpose: req.body?.videoPurpose
    });
    
    try {
      const { problem, targetAudience, platform, videoPurpose } = req.body;
      
      if (!problem || problem.trim().length < 10) {
        console.log("Solution generation failed: Problem too short");
        return res.status(400).json({ error: "Problem description required (at least 10 characters)" });
      }

      // Video purpose context for solution generation
      const purposeGuidance: Record<string, string> = {
        authority: "For an AUTHORITY video, the solution should be a bold opinion, unique insight, or prediction that positions the creator as an expert. Focus on contrarian takes or insider knowledge.",
        education: "For an EDUCATION video, the solution should be a clear, teachable method, framework, or technique that viewers can apply immediately. Focus on practical, step-by-step value.",
        storytelling: "For a STORYTELLING video, the solution should be a lesson, realization, or transformation that came from personal experience. Focus on emotional takeaways and relatable wisdom.",
      };

      const systemPrompt = `You are an expert content strategist helping creators develop their "CORE TEACHING" or "GOLDEN NUGGET" - the single most valuable insight that will be the heart of their video.

This is NOT just a vague solution - it's THE key teaching that the entire script will revolve around. The script will spend most of its time expanding on, explaining, and proving this core teaching.

Generate 4 unique CORE TEACHING ideas that directly address the given problem. Each should be:
- The ONE key insight or method that solves the problem (not multiple tips)
- Specific and concrete enough to build an entire video around
- Something that can be explained with examples, steps, or proof points
- The "aha moment" that viewers will remember and share

${videoPurpose ? purposeGuidance[videoPurpose] || '' : ''}

Return ONLY a JSON array with this format:
[
  {
    "id": "sol_1",
    "headline": "Short 5-8 word summary of the core teaching",
    "description": "2-3 sentence explanation of what the viewer will learn and why it's valuable",
    "angle": "The unique angle (e.g., 'quick hack', 'mindset shift', 'step-by-step', 'counterintuitive', 'insider secret')"
  }
]`;

      const userPrompt = `PROBLEM: ${problem}
${videoPurpose ? `VIDEO TYPE: ${videoPurpose}` : ''}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}
${platform ? `PLATFORM: ${platform}` : ''}

Generate 4 CORE TEACHING ideas - each should be THE central insight that an entire video script would be built around. Not a list of tips, but ONE key teaching that delivers real value.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.85,
      });

      const content = response.choices[0]?.message?.content || "[]";
      
      try {
        const cleanedJson = content
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        
        const solutions = JSON.parse(cleanedJson);
        
        const normalizedSolutions = (Array.isArray(solutions) ? solutions : []).slice(0, 5).map((s: any, i: number) => ({
          id: `sol_${i + 1}_${Date.now()}`,
          headline: s.headline || `Solution ${i + 1}`,
          description: s.description || "AI-generated solution",
          angle: s.angle || "general",
          selected: false,
          edited: false,
        }));
        
        res.json({ 
          solutions: normalizedSolutions,
          problem: problem.substring(0, 100),
        });
      } catch (parseError) {
        console.error("Failed to parse solution generation response:", parseError);
        console.error("Raw content that failed to parse:", content);
        res.status(500).json({ error: "Failed to parse generated solutions" });
      }
    } catch (error: any) {
      console.error("Solution generation error:", error);
      const errorDetails = {
        message: error?.message || "Unknown error",
        status: error?.status,
        code: error?.code,
        type: error?.type,
        cause: error?.cause?.message,
      };
      console.error("Error details:", errorDetails);
      
      // Return detailed error in development or if it's a connection issue
      const isConnectionError = error?.message?.includes('ECONNREFUSED') || 
                                error?.message?.includes('fetch failed') ||
                                error?.code === 'ECONNREFUSED';
      
      if (isConnectionError) {
        res.status(500).json({ 
          error: "AI service temporarily unavailable. Please try again in a moment.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      } else {
        res.status(500).json({ 
          error: "Failed to generate solutions. Please try again.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      }
    }
  });

  // Generate problem ideas based on target audience and niche
  app.post("/api/problems/generate", async (req, res) => {
    try {
      const { targetAudience, platform, videoPurpose, niche } = req.body;
      
      if (!targetAudience && !niche) {
        return res.status(400).json({ error: "Target audience or niche is required" });
      }

      const purposeContext: Record<string, string> = {
        authority: "Focus on problems where the creator can share bold opinions or unique insights",
        education: "Focus on problems where the creator can teach practical solutions",
        storytelling: "Focus on problems that are emotionally relatable and personal",
      };

      const systemPrompt = `You are an expert content strategist helping creators identify compelling PROBLEMS or PAIN POINTS that resonate with their target audience.

A good problem for short-form video content should:
- Be specific and immediately relatable to the audience
- Create an emotional response (frustration, anxiety, curiosity)
- Be solvable or addressable in a short video format
- Make viewers think "Yes! That's exactly my problem!"

${videoPurpose ? purposeContext[videoPurpose] || '' : ''}

Generate 5 unique problem/pain point ideas that would make great video topics.

Return ONLY a JSON array with this format:
[
  {
    "id": "prob_1",
    "problem": "A specific problem statement in 1-2 sentences",
    "why": "Why this resonates with the target audience",
    "hook_potential": "High/Medium - why this would grab attention"
  }
]`;

      const userPrompt = `Generate 5 compelling PROBLEM/PAIN POINT ideas for video content:

TARGET AUDIENCE: ${targetAudience || 'General audience'}
NICHE/TOPIC AREA: ${niche || 'General content creation'}
PLATFORM: ${platform || 'TikTok/Reels'}
VIDEO TYPE: ${videoPurpose || 'education'}

Create problems that are:
1. Specific enough to relate to immediately
2. Emotional enough to grab attention
3. Solvable in a short-form video`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.9,
      });

      const content = response.choices[0]?.message?.content || "[]";
      
      try {
        const cleanedJson = content
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        
        const problems = JSON.parse(cleanedJson);
        
        const normalizedProblems = (Array.isArray(problems) ? problems : []).slice(0, 5).map((p: any, i: number) => ({
          id: `prob_${i + 1}_${Date.now()}`,
          problem: p.problem || `Problem ${i + 1}`,
          why: p.why || "Resonates with the audience",
          hookPotential: p.hook_potential || "Medium",
        }));
        
        res.json({ 
          problems: normalizedProblems,
          targetAudience: targetAudience?.substring(0, 50),
        });
      } catch (parseError) {
        console.error("Failed to parse problem generation response:", parseError);
        res.status(500).json({ error: "Failed to parse generated problems" });
      }
    } catch (error: any) {
      console.error("Problem generation error:", error);
      const errorDetails = {
        message: error?.message || "Unknown error",
        status: error?.status,
        code: error?.code,
        type: error?.type,
        cause: error?.cause?.message,
        baseURL: openaiBaseURL,
        hasApiKey: hasOwnOpenAIKey,
        isProduction: isProductionDeployment,
      };
      console.error("Problem generation error details:", JSON.stringify(errorDetails, null, 2));
      
      const isConnectionError = error?.message?.includes('ECONNREFUSED') || 
                                error?.message?.includes('fetch failed') ||
                                error?.code === 'ECONNREFUSED';
      
      if (isConnectionError) {
        res.status(500).json({ 
          error: "AI service temporarily unavailable. Please try again in a moment.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      } else {
        res.status(500).json({ 
          error: "Failed to generate problems. Please try again.",
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
      }
    }
  });

  app.get("/api/categories", (req, res) => {
    res.json(scriptCategories);
  });

  app.get("/api/structures", (req, res) => {
    res.json(structureFormats);
  });

  app.get("/api/pricing", (req, res) => {
    res.json({
      tiers: pricingTiers,
      knowledgeBaseTypes,
      contentStrategyCategories,
    });
  });

  // Knowledge Base routes - require Pro subscription for user-specific documents
  app.get("/api/knowledge-base", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      const docs = await storage.getKnowledgeBaseDocs(userId);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge base documents" });
    }
  });

  app.get("/api/knowledge-base/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      const doc = await storage.getKnowledgeBaseDoc(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      // Check ownership
      if (doc.userId && doc.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/knowledge-base", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      const { type, title, content, summary, tags } = req.body;
      if (!type || !title || !content) {
        return res.status(400).json({ error: "Type, title, and content are required" });
      }
      const doc = await storage.createKnowledgeBaseDoc({ 
        userId,
        type, 
        title, 
        content, 
        summary, 
        tags 
      });
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create knowledge base document" });
    }
  });

  app.patch("/api/knowledge-base/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      const existingDoc = await storage.getKnowledgeBaseDoc(req.params.id);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }
      // Check ownership
      if (existingDoc.userId && existingDoc.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updates = req.body;
      const doc = await storage.updateKnowledgeBaseDoc(req.params.id, updates);
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/knowledge-base/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      const existingDoc = await storage.getKnowledgeBaseDoc(req.params.id);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }
      // Check ownership
      if (existingDoc.userId && existingDoc.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteKnowledgeBaseDoc(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // File upload with OCR for knowledge base
  app.post("/api/knowledge-base/upload", isAuthenticated, (req: any, res, next) => {
    upload.array('files', MAX_FILES)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB per file.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: `Too many files. Maximum is ${MAX_FILES} files.` });
        }
        if (err.message?.includes('Unsupported file type')) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      if (files.length > MAX_FILES) {
        return res.status(400).json({ error: `Maximum ${MAX_FILES} files allowed` });
      }

      const results: Array<{
        filename: string;
        success: boolean;
        docId?: string;
        error?: string;
        source?: string;
      }> = [];

      for (const file of files) {
        try {
          const extracted = await extractTextFromFile(
            file.buffer,
            file.mimetype,
            file.originalname
          );

          const text = truncateText(extracted.text);
          
          if (!text || text.trim().length < 10) {
            results.push({
              filename: file.originalname,
              success: false,
              error: "Could not extract meaningful text from file",
            });
            continue;
          }

          // Create knowledge base document from extracted text
          const doc = await storage.createKnowledgeBaseDoc({
            userId,
            type: "custom",
            title: file.originalname.replace(/\.[^/.]+$/, ""),
            content: text,
            summary: `Extracted from ${file.originalname} via ${extracted.source}${extracted.confidence ? ` (${Math.round(extracted.confidence)}% confidence)` : ""}`,
            tags: extracted.source,
          });

          results.push({
            filename: file.originalname,
            success: true,
            docId: doc.id,
            source: extracted.source,
          });
        } catch (fileError: any) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          results.push({
            filename: file.originalname,
            success: false,
            error: fileError.message || "Failed to process file",
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      res.json({
        message: `Successfully processed ${successCount} of ${files.length} files`,
        results,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to process uploaded files" });
    }
  });

  app.get("/api/content-strategies", async (req, res) => {
    try {
      const strategies = await storage.getContentStrategies();
      res.json({
        categories: contentStrategyCategories,
        strategies,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content strategies" });
    }
  });

  app.post("/api/content-strategies", async (req, res) => {
    try {
      const { name, category, topics, hooks, schedule } = req.body;
      if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required" });
      }
      const strategy = await storage.createContentStrategy({ 
        name, 
        category, 
        topics, 
        hooks, 
        schedule 
      });
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: "Failed to create content strategy" });
    }
  });

  app.delete("/api/content-strategies/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContentStrategy(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  });

  // User Usage Tracking
  app.get("/api/user/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usage = await storage.getUserUsage(userId, month);
      res.json(usage || {
        scriptsGenerated: 0,
        deepResearchUsed: 0,
        knowledgeBaseQueries: 0,
        month,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch usage" });
    }
  });

  // User Subscription
  app.get("/api/user/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription) {
        // Return default starter plan for new users
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        return res.json({
          plan: "starter",
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
        });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Create Stripe Checkout Session for subscription with 7-day trial
  app.post("/api/billing/create-checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user already has an active subscription in local DB
      if (user.stripeSubscriptionId && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing')) {
        return res.status(400).json({ 
          error: "You already have an active subscription",
          hasActiveSubscription: true
        });
      }
      
      // Import Stripe service
      const { stripeService } = await import("./stripeService");
      
      // SAFEGUARD: Also check Stripe directly to prevent duplicate subscriptions
      // This catches cases where webhook hasn't synced yet or user clicks rapidly
      if (user.stripeCustomerId) {
        try {
          const stripe = await stripeService.getStripeClient();
          const existingSubs = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'all',
            limit: 10,
          });
          
          const activeSubs = existingSubs.data.filter(
            sub => sub.status === 'active' || sub.status === 'trialing'
          );
          
          if (activeSubs.length > 0) {
            console.log(`[DUPLICATE PREVENTION] User ${userId} already has ${activeSubs.length} active subscription(s) in Stripe`);
            
            // Sync the subscription to local DB
            const latestSub = activeSubs[0];
            await storage.updateUserSubscription(userId, {
              stripeSubscriptionId: latestSub.id,
              subscriptionStatus: latestSub.status,
              plan: 'pro',
            });
            
            return res.status(400).json({ 
              error: "You already have an active subscription",
              hasActiveSubscription: true
            });
          }
        } catch (stripeCheckError) {
          console.error("Error checking Stripe for existing subscriptions:", stripeCheckError);
          // Continue - don't block checkout if check fails
        }
      }
      
      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      const email = user.email || user.username || `user-${userId}@viralscript.app`;
      
      // Check if existing customer is valid in current Stripe account
      if (stripeCustomerId) {
        try {
          const stripe = await stripeService.getStripeClient();
          await stripe.customers.retrieve(stripeCustomerId);
          console.log("Existing Stripe customer verified:", stripeCustomerId);
        } catch (customerError: any) {
          // Customer doesn't exist in this Stripe account, create a new one
          console.log("Existing customer invalid, creating new one:", customerError.message);
          stripeCustomerId = null;
        }
      }
      
      // Create new customer if needed
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(email, userId);
        stripeCustomerId = customer.id;
        console.log("Created new Stripe customer:", stripeCustomerId);
        
        // Update user with Stripe customer ID
        await storage.updateUserStripeCustomer(userId, stripeCustomerId);
      }
      
      // Get the Pro subscription price from database (synced from Stripe)
      // $19.99/month plan
      if (!db) {
        console.error("Database not initialized");
        return res.status(500).json({ error: "Database not available" });
      }
      
      const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
      console.log(`Looking for Stripe price... (env: ${isProduction ? 'production' : 'development'})`);
      
      let priceId: string | null = null;
      
      // First try to get price from local database
      try {
        const priceResult = await db.execute(sql`
          SELECT id FROM stripe.prices 
          WHERE unit_amount = 1999 AND active = true 
          ORDER BY created DESC LIMIT 1
        `);
        
        if (priceResult.rows && priceResult.rows.length > 0) {
          priceId = (priceResult.rows[0] as any).id;
          console.log("Found price in database:", priceId);
        }
      } catch (dbError) {
        console.log("Database price lookup failed, will try Stripe API directly");
      }
      
      // If not found in database, fetch directly from Stripe API
      if (!priceId) {
        console.log("Price not in database, fetching from Stripe API...");
        try {
          const stripe = await stripeService.getStripeClient();
          const prices = await stripe.prices.list({
            active: true,
            type: 'recurring',
            limit: 10
          });
          
          console.log(`Found ${prices.data.length} prices from Stripe API`);
          
          // Look for $19.99 price first
          const targetPrice = prices.data.find(p => p.unit_amount === 1999);
          if (targetPrice) {
            priceId = targetPrice.id;
            console.log("Found $19.99 price from Stripe API:", priceId);
          } else if (prices.data.length > 0) {
            // Fall back to first available recurring price
            priceId = prices.data[0].id;
            console.log("Using first available price from Stripe API:", priceId);
          }
        } catch (stripeApiError: any) {
          console.error("Failed to fetch prices from Stripe API:", stripeApiError.message);
        }
      }
      
      // Use environment variable fallback if all lookups fail
      if (!priceId) {
        const fallbackPriceId = process.env.STRIPE_PRICE_ID;
        if (fallbackPriceId) {
          console.log("Using fallback price from environment:", fallbackPriceId);
          priceId = fallbackPriceId;
        } else {
          return res.status(500).json({ 
            error: "No subscription prices found", 
            details: "Please set STRIPE_PRICE_ID environment variable"
          });
        }
      }
      
      console.log("Using price ID:", priceId);
      
      // Create checkout session with 7-day trial
      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      console.log("Creating checkout session with:", {
        customerId: stripeCustomerId,
        priceId,
        successUrl: `${baseUrl}/?subscription=success`,
        cancelUrl: `${baseUrl}/?subscription=cancelled`,
        trialDays: 7
      });
      
      try {
        // Include session_id in success URL so we can verify it without relying on webhooks
        const session = await stripeService.createCheckoutSession(
          stripeCustomerId,
          priceId,
          `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
          `${baseUrl}/?subscription=cancelled`,
          7 // 7-day trial
        );
        
        console.log("Checkout session created:", session.id, session.url);
        res.json({ url: session.url });
      } catch (stripeError: any) {
        console.error("Stripe createCheckoutSession error:", stripeError);
        console.error("Stripe error details:", {
          message: stripeError?.message,
          type: stripeError?.type,
          code: stripeError?.code,
          statusCode: stripeError?.statusCode,
          param: stripeError?.param,
          requestId: stripeError?.requestId
        });
        throw stripeError;
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      console.error("Stripe error details:", {
        message: error?.message,
        type: error?.type,
        code: error?.code,
        statusCode: error?.statusCode,
        raw: error?.raw
      });
      res.status(500).json({ error: "Failed to create checkout session", details: error?.message || "Unknown error" });
    }
  });

  // Verify Checkout Session - Called after Stripe redirect to sync subscription without relying on webhooks
  app.get("/api/billing/verify-session", isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.query.session_id as string;
      let userId = req.user?.id;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }
      
      console.log(`[Checkout Verify] Verifying session ${sessionId} for user ${userId}`);
      
      const { stripeService } = await import("./stripeService");
      const stripe = await stripeService.getStripeClient();
      
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });
      
      console.log(`[Checkout Verify] Session status: ${session.status}, payment_status: ${session.payment_status}`);
      
      if (session.status !== 'complete') {
        return res.status(400).json({ 
          error: "Checkout session is not complete",
          status: session.status
        });
      }
      
      // Get subscription details
      const subscription = session.subscription as any;
      if (!subscription) {
        return res.status(400).json({ error: "No subscription found in session" });
      }
      
      const customerId = typeof session.customer === 'string' 
        ? session.customer 
        : (session.customer as any)?.id;
      
      // Get customer email from Stripe session
      const customerEmail = session.customer_email || 
        (session.customer as any)?.email;
      
      // Get the authenticated user's email from session
      const sessionUserEmail = req.session?.userEmail || req.user?.email;
      
      console.log(`[Checkout Verify] Subscription: ${subscription.id}, Status: ${subscription.status}, Customer: ${customerId}, Email: ${customerEmail}, SessionEmail: ${sessionUserEmail}`);
      
      // SECURITY: Validate that the checkout session email matches the authenticated user
      // This prevents subscription hijacking attacks
      if (customerEmail && sessionUserEmail && customerEmail.toLowerCase() !== sessionUserEmail.toLowerCase()) {
        console.error(`[Checkout Verify] SECURITY: Email mismatch - checkout email: ${customerEmail}, session email: ${sessionUserEmail}`);
        return res.status(403).json({ 
          error: "Email mismatch", 
          details: "The subscription email does not match your account email" 
        });
      }
      
      // Try to find user by ID first, then by email
      let user = userId ? await storage.getUser(userId) : null;
      
      // If user not found by ID, try to find by email (recovery for session/ID mismatch)
      if (!user && customerEmail && db) {
        console.log(`[Checkout Verify] User not found by ID, trying to find by email: ${customerEmail}`);
        
        // Try to find by email - SECURITY: only find, never create blindly
        const result = await db.execute(
          sql`SELECT * FROM users WHERE username = ${customerEmail} OR email = ${customerEmail} LIMIT 1`
        );
        
        if (result.rows.length > 0) {
          const foundUser = result.rows[0] as any;
          user = foundUser;
          userId = foundUser.id;
          // Update session with correct userId
          req.session.userId = userId;
          req.session.userEmail = customerEmail;
          console.log(`[Checkout Verify] Found user by email: ${userId}`);
          
          // Save updated session
          await new Promise<void>((resolve) => {
            req.session.save((err: any) => {
              if (err) console.error("[Checkout Verify] Session save error:", err);
              resolve();
            });
          });
        } else {
          console.log(`[Checkout Verify] No existing user found for email: ${customerEmail}`);
        }
      }
      
      if (!user) {
        console.error(`[Checkout Verify] Could not find user for session ${sessionId}. User may need to login first.`);
        return res.status(404).json({ 
          error: "User not found", 
          details: "Please login or register with the same email you used for checkout"
        });
      }
      
      // Update customer ID first
      if (customerId) {
        await storage.updateUserStripeCustomer(userId, customerId);
      }
      
      // Calculate trial end date if in trialing status
      const trialEndsAt = subscription.status === 'trialing' && subscription.trial_end 
        ? new Date(subscription.trial_end * 1000)
        : undefined;
      
      // Update user with subscription info
      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        plan: 'starter', // Default plan for $19.99 subscription
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
        trialEndsAt,
      });
      
      console.log(`[Checkout Verify] Successfully synced subscription for user ${userId}`);
      
      res.json({ 
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        message: "Subscription verified and synced successfully"
      });
    } catch (error: any) {
      console.error("[Checkout Verify] Error:", error);
      res.status(500).json({ error: "Failed to verify checkout session", details: error?.message });
    }
  });

  // Cancel Subscription
  app.post("/api/billing/cancel-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ error: "No active subscription found" });
      }
      
      // Import Stripe client
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      // Cancel at end of period (not immediately)
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Update local database
      await storage.updateUserSubscription(userId, {
        cancelAtPeriodEnd: 1,
      });
      
      res.json({ success: true, message: "Subscription will cancel at end of billing period" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Resume/Reactivate Subscription (undo cancel)
  app.post("/api/billing/resume-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ error: "No subscription found" });
      }
      
      // Import Stripe client
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      // Resume subscription
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      
      // Update local database
      await storage.updateUserSubscription(userId, {
        cancelAtPeriodEnd: 0,
      });
      
      res.json({ success: true, message: "Subscription resumed" });
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ error: "Failed to resume subscription" });
    }
  });

  // Get Stripe Customer Portal URL
  app.post("/api/billing/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No billing account found" });
      }
      
      // Import Stripe service
      const { stripeService } = await import("./stripeService");
      
      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/settings`
      );
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create billing portal session" });
    }
  });

  // Get Billing Status
  app.get("/api/billing/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        hasSubscription: !!user.stripeSubscriptionId,
        status: user.subscriptionStatus || null,
        plan: user.plan || "starter",
        currentPeriodEnd: user.currentPeriodEnd || null,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd === 1,
        trialEndsAt: user.trialEndsAt || null,
        isTrialing: user.subscriptionStatus === "trialing",
      });
    } catch (error) {
      console.error("Error fetching billing status:", error);
      res.status(500).json({ error: "Failed to fetch billing status" });
    }
  });

  // Trial Status endpoint - all features are now free
  app.get("/api/user/trial-status", isAuthenticated, async (req: any, res) => {
    try {
      res.json({
        isActive: false,
        daysRemaining: 999,
        scriptsUsed: 0,
        scriptsLimit: 999999,
        trialEndsAt: null,
        isPaidUser: true,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trial status" });
    }
  });

  // Pro Feature: Import Creator Style from Social Media
  app.post("/api/scrape/tiktok", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "TikTok username is required" });
      }

      // Scrape the profile
      const content = await scrapeTikTokProfile(username);
      
      // Analyze the creator's style
      const analysis = analyzeCreatorStyle(content);

      // Generate knowledge base content using AI
      const styleDescription = await generateStyleFromAnalysis(content, analysis);

      res.json({
        success: true,
        platform: "tiktok",
        username: content.username,
        postsAnalyzed: content.totalPosts,
        analysis,
        suggestedKnowledgeBase: styleDescription,
      });
    } catch (error: any) {
      console.error("TikTok scrape error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to scrape TikTok profile",
        details: "Make sure the username is correct and the profile is public"
      });
    }
  });

  // Viral Examples API - Fetch top TikTok captions for inspiration (Pro feature)
  app.post("/api/viral-examples", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { topic, limit = 5 } = req.body;
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({ error: "Topic is required (at least 3 characters)" });
      }

      if (!process.env.APIFY_API_TOKEN) {
        return res.status(503).json({ 
          error: "Viral Examples feature is not configured",
          details: "APIFY_API_TOKEN is required"
        });
      }

      const { fetchViralExamples } = await import("./apify");
      const result = await fetchViralExamples(topic.trim(), Math.min(limit, 10));

      res.json({
        success: true,
        platform: "tiktok",
        ...result,
      });
    } catch (error: any) {
      console.error("Viral examples error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch viral examples",
        details: "Please try again or use a different topic"
      });
    }
  });

  // AP5 Strategic Insights API - Enhanced research for script generation (Pro feature)
  app.post("/api/strategic-insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { topic, platforms, limit = 20 } = req.body;
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({ error: "Topic is required (at least 3 characters)" });
      }

      if (!process.env.APIFY_API_TOKEN) {
        return res.status(503).json({ 
          error: "Strategic Insights feature is not configured",
          details: "APIFY_API_TOKEN is required"
        });
      }

      const { fetchAP5Insights } = await import("./apify");
      const result = await fetchAP5Insights(topic.trim(), {
        platforms: platforms || ["tiktok", "instagram"],
        limit: Math.min(limit, 30),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("Strategic insights error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch strategic insights",
        details: "Please try again or use a different topic"
      });
    }
  });

  // Instagram Viral Examples API - Fetch top Instagram captions for inspiration (Pro feature)
  app.post("/api/viral-examples/instagram", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { topic, limit = 5 } = req.body;
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({ error: "Topic is required (at least 3 characters)" });
      }

      if (!process.env.APIFY_API_TOKEN) {
        return res.status(503).json({ 
          error: "Instagram Viral Examples feature is not configured",
          details: "APIFY_API_TOKEN is required"
        });
      }

      const { fetchInstagramViralExamples } = await import("./apify");
      const result = await fetchInstagramViralExamples(topic.trim(), Math.min(limit, 10));

      res.json({
        success: true,
        platform: "instagram",
        ...result,
      });
    } catch (error: any) {
      console.error("Instagram viral examples error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch Instagram viral examples",
        details: "Please try again or use a different topic"
      });
    }
  });

  app.post("/api/scrape/instagram", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Instagram username is required" });
      }

      // Scrape the profile
      const content = await scrapeInstagramProfile(username);
      
      // Analyze the creator's style
      const analysis = analyzeCreatorStyle(content);

      // Generate knowledge base content using AI
      const styleDescription = await generateStyleFromAnalysis(content, analysis);

      res.json({
        success: true,
        platform: "instagram",
        username: content.username,
        postsAnalyzed: content.totalPosts,
        analysis,
        suggestedKnowledgeBase: styleDescription,
      });
    } catch (error: any) {
      console.error("Instagram scrape error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to scrape Instagram profile",
        details: "Make sure the username is correct and the profile is public"
      });
    }
  });

  // Helper function to generate style description from analysis
  async function generateStyleFromAnalysis(
    content: { platform: string; username: string; posts: Array<{ text: string }> },
    analysis: { hooks: string[]; phrases: string[]; avgLength: number; styleNotes: string; topPerformingContent: string[] }
  ): Promise<string> {
    try {
      const sampleContent = content.posts.slice(0, 10).map(p => p.text).join("\n\n---\n\n");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are analyzing a content creator's style from their ${content.platform} posts. 
Create a concise style guide that captures their unique voice, patterns, and approach.
Write it as instructions for replicating their style in new scripts.
Be specific about their word choices, sentence structures, and engagement techniques.`
          },
          {
            role: "user",
            content: `Analyze @${content.username}'s style from these top-performing posts:

${sampleContent}

Analysis data:
- Common hooks: ${analysis.hooks.slice(0, 5).join(", ")}
- Frequent phrases: ${analysis.phrases.slice(0, 10).join(", ")}
- Average word count: ${analysis.avgLength}
- Style notes: ${analysis.styleNotes}

Create a style guide for writing scripts that sound exactly like this creator.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || "Style analysis could not be generated.";
    } catch (error) {
      console.error("Style generation error:", error);
      return `Style Guide for @${content.username}:
- Opening hooks: ${analysis.hooks.slice(0, 3).join("; ")}
- Common phrases: ${analysis.phrases.slice(0, 5).join(", ")}
- Average script length: ${analysis.avgLength} words
- Voice characteristics: ${analysis.styleNotes}`;
    }
  }

  // ============ VERSION HISTORY ROUTES ============
  
  // Get all versions for a script
  app.get("/api/scripts/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const versions = await storage.getScriptVersions(req.params.id, userId);
      res.json({ versions });
    } catch (error) {
      console.error("Error fetching versions:", error);
      res.status(500).json({ error: "Failed to fetch version history" });
    }
  });

  // Create a new version (save current state)
  app.post("/api/scripts/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const { label, script, wordCount, gradeLevel, parameters } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Verify script ownership before creating version
      const existingScript = await storage.getScript(req.params.id, userId);
      if (!existingScript) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      const version = await storage.createScriptVersion({
        scriptId: req.params.id,
        userId,
        label,
        script,
        wordCount: wordCount?.toString(),
        gradeLevel: gradeLevel?.toString(),
        parameters,
      });
      
      res.json({ version, message: "Version saved successfully" });
    } catch (error) {
      console.error("Error creating version:", error);
      res.status(500).json({ error: "Failed to save version" });
    }
  });

  // Revert to a specific version
  app.post("/api/scripts/:id/versions/:versionId/revert", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const version = await storage.getScriptVersion(req.params.versionId, userId);
      if (!version) {
        return res.status(404).json({ error: "Version not found" });
      }
      
      // Update the main script with this version's content
      const updatedScript = await storage.updateScript(req.params.id, {
        script: version.script,
      }, userId);
      
      // Create a new version marking this as a revert
      await storage.createScriptVersion({
        scriptId: req.params.id,
        userId,
        label: `Reverted to v${version.version}`,
        script: version.script,
        wordCount: version.wordCount,
        gradeLevel: version.gradeLevel,
        parameters: version.parameters as any,
      });
      
      res.json({ 
        script: updatedScript, 
        message: `Reverted to version ${version.version}` 
      });
    } catch (error) {
      console.error("Error reverting version:", error);
      res.status(500).json({ error: "Failed to revert to version" });
    }
  });

  // ============ COLLABORATIVE EDITING WEBSOCKET ============
  
  // Track active collaborative sessions
  const collaborativeSessions = new Map<string, {
    scriptId: string;
    editors: Map<string, { id: string; name: string; color: string; lastSeen: Date }>;
    currentContent: string;
  }>();

  // WebSocket handling for real-time collaboration
  const wss = new (await import("ws")).WebSocketServer({ server: httpServer, path: "/ws/collaborate" });
  
  wss.on("connection", (ws, req) => {
    let sessionId: string = "";
    let editorId: string = "";
    
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "join": {
            sessionId = message.scriptId || "";
            editorId = message.editorId || randomUUID();
            
            if (!sessionId) return;
            
            // Create or join session
            if (!collaborativeSessions.has(sessionId)) {
              collaborativeSessions.set(sessionId, {
                scriptId: sessionId,
                editors: new Map(),
                currentContent: message.initialContent || "",
              });
            }
            
            const session = collaborativeSessions.get(sessionId)!;
            const editorColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];
            const color = editorColors[session.editors.size % editorColors.length];
            
            session.editors.set(editorId, {
              id: editorId,
              name: message.editorName || `Editor ${session.editors.size + 1}`,
              color,
              lastSeen: new Date(),
            });
            
            // Send current state to new editor
            ws.send(JSON.stringify({
              type: "sync",
              content: session.currentContent,
              editors: Array.from(session.editors.values()),
              yourId: editorId,
              yourColor: color,
            }));
            
            // Broadcast new editor to others
            broadcastToSession(sessionId, {
              type: "editor_joined",
              editor: session.editors.get(editorId),
              editors: Array.from(session.editors.values()),
            }, editorId);
            break;
          }
          
          case "update": {
            if (!sessionId || !editorId) return;
            
            const session = collaborativeSessions.get(sessionId);
            if (!session) return;
            
            session.currentContent = message.content;
            session.editors.get(editorId)!.lastSeen = new Date();
            
            // Broadcast update to all other editors
            broadcastToSession(sessionId, {
              type: "content_update",
              content: message.content,
              editorId,
              cursorPosition: message.cursorPosition,
            }, editorId);
            break;
          }
          
          case "cursor": {
            if (!sessionId || !editorId) return;
            
            // Broadcast cursor position
            broadcastToSession(sessionId, {
              type: "cursor_update",
              editorId,
              position: message.position,
              selection: message.selection,
            }, editorId);
            break;
          }
          
          case "leave": {
            if (sessionId && editorId) {
              const session = collaborativeSessions.get(sessionId);
              if (session) {
                session.editors.delete(editorId);
                broadcastToSession(sessionId, {
                  type: "editor_left",
                  editorId,
                  editors: Array.from(session.editors.values()),
                });
                
                // Clean up empty sessions
                if (session.editors.size === 0) {
                  collaborativeSessions.delete(sessionId);
                }
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    
    ws.on("close", () => {
      if (sessionId && editorId) {
        const session = collaborativeSessions.get(sessionId);
        if (session) {
          session.editors.delete(editorId);
          broadcastToSession(sessionId, {
            type: "editor_left",
            editorId,
            editors: Array.from(session.editors.values()),
          });
          
          if (session.editors.size === 0) {
            collaborativeSessions.delete(sessionId);
          }
        }
      }
    });
  });
  
  function broadcastToSession(sessionId: string, message: any, excludeEditorId?: string) {
    const session = collaborativeSessions.get(sessionId);
    if (!session) return;
    
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
      }
    });
  }

  // ================== SCRIPT TEMPLATES API ==================
  
  // Get all templates for current user
  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const templates = await storage.getScriptTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get single template by ID (requires authentication + ownership or public)
  app.get("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const template = await storage.getScriptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Check ownership or public access
      if (template.userId !== userId && template.isPublic !== "true") {
        return res.status(403).json({ error: "Not authorized to view this template" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Create new template
  app.post("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Validate input using Zod schema
      const validationResult = insertScriptTemplateSchema.safeParse({
        ...req.body,
        userId,
        isPublic: req.body.isPublic ? "true" : "false",
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid template data", 
          details: validationResult.error.issues 
        });
      }
      
      const data = validationResult.data;
      
      if (!data.name || data.name.trim().length === 0) {
        return res.status(400).json({ error: "Template name is required" });
      }
      
      const template = await storage.createScriptTemplate({
        userId,
        name: data.name.trim(),
        description: data.description || null,
        platform: data.platform || "tiktok",
        duration: data.duration || "90",
        category: data.category || "content_creation",
        structure: data.structure || "problem_solver",
        hook: data.hook || "painful_past",
        tone: data.tone || null,
        voice: data.voice || null,
        pacing: data.pacing || null,
        videoType: data.videoType || "talking_head",
        creatorStyle: data.creatorStyle || "default",
        defaultTargetAudience: data.defaultTargetAudience || null,
        defaultCta: data.defaultCta || null,
        isPublic: data.isPublic || "false",
      });
      
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update template
  app.patch("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const template = await storage.getScriptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      if (template.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this template" });
      }
      
      const updated = await storage.updateScriptTemplate(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const template = await storage.getScriptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      if (template.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this template" });
      }
      
      await storage.deleteScriptTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Use template (increment usage count)
  app.post("/api/templates/:id/use", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const template = await storage.getScriptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Only allow usage tracking for own templates or public templates
      if (template.userId !== userId && template.isPublic !== "true") {
        return res.status(403).json({ error: "Not authorized to use this template" });
      }
      
      await storage.incrementTemplateUsage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error using template:", error);
      res.status(500).json({ error: "Failed to use template" });
    }
  });

  // =====================
  // COMPETITIVE ANALYSIS
  // =====================
  
  // Search for competitive videos by keyword
  app.post("/api/competitive/search", isAuthenticated, async (req: any, res) => {
    try {
      const { keyword, platforms = ["tiktok", "instagram"], limit = 20 } = req.body;
      
      if (!keyword || typeof keyword !== "string" || keyword.trim().length < 2) {
        return res.status(400).json({ error: "Please provide a search keyword (at least 2 characters)" });
      }

      const results: any[] = [];
      const profiles: Map<string, any> = new Map();

      // Search TikTok if included
      if (platforms.includes("tiktok")) {
        try {
          const tiktokResults = await searchTikTokByKeyword(keyword.trim(), Math.ceil(limit / 2));
          
          for (const post of tiktokResults.posts) {
            const views = post.views || 0;
            const likes = post.likes || 0;
            const comments = post.comments || 0;
            const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
            
            // Calculate outlier score (simulated - would need creator's avg in real scenario)
            const outlierScore = views > 100000 ? Math.round((views / 50000) * 10) / 10 : 1;
            
            results.push({
              id: post.id,
              platform: "tiktok",
              videoUrl: `https://www.tiktok.com/@${post.author}/video/${post.id}`,
              thumbnailUrl: "",
              caption: post.text?.slice(0, 200) || "",
              creatorHandle: `@${post.author}`,
              creatorName: post.author,
              postedAt: new Date().toISOString(),
              views,
              likes,
              comments,
              shares: post.shares || 0,
              engagementRate: Math.round(engagementRate * 100) / 100,
              outlierScore,
              hookType: detectHookTypeFromText(post.text || ""),
              formatType: detectFormatTypeFromText(post.text || ""),
            });

            // Aggregate profile data
            if (!profiles.has(post.author)) {
              profiles.set(post.author, {
                id: post.author,
                platform: "tiktok",
                handle: `@${post.author}`,
                displayName: post.author,
                followers: 0,
                avgViews: views,
                avgEngagement: engagementRate,
                totalVideos: 1,
                topVideos: [],
              });
            } else {
              const profile = profiles.get(post.author);
              profile.totalVideos++;
              profile.avgViews = (profile.avgViews + views) / 2;
              profile.avgEngagement = (profile.avgEngagement + engagementRate) / 2;
            }
          }
        } catch (err) {
          console.error("TikTok search error:", err);
        }
      }

      // Search Instagram if included (using hashtag/keyword search)
      if (platforms.includes("instagram")) {
        try {
          const igResults = await searchInstagramByKeyword(keyword.trim(), Math.ceil(limit / 2));
          
          for (const post of igResults.posts) {
            const views = post.views || post.likes * 10; // Estimate views from likes
            const likes = post.likes || 0;
            const comments = post.comments || 0;
            const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
            const outlierScore = views > 50000 ? Math.round((views / 25000) * 10) / 10 : 1;
            
            results.push({
              id: post.id,
              platform: "instagram",
              videoUrl: `https://www.instagram.com/reel/${post.id}/`,
              thumbnailUrl: post.thumbnailUrl || "",
              caption: post.text?.slice(0, 200) || "",
              creatorHandle: `@${post.author}`,
              creatorName: post.author,
              postedAt: post.timestamp || new Date().toISOString(),
              views,
              likes,
              comments,
              engagementRate: Math.round(engagementRate * 100) / 100,
              outlierScore,
              hookType: detectHookTypeFromText(post.text || ""),
              formatType: detectFormatTypeFromText(post.text || ""),
            });

            if (!profiles.has(post.author)) {
              profiles.set(post.author, {
                id: post.author,
                platform: "instagram",
                handle: `@${post.author}`,
                displayName: post.author,
                followers: 0,
                avgViews: views,
                avgEngagement: engagementRate,
                totalVideos: 1,
                topVideos: [],
              });
            }
          }
        } catch (err) {
          console.error("Instagram search error:", err);
        }
      }

      // Sort by views (outlier score)
      results.sort((a, b) => b.views - a.views);

      // Calculate analytics
      const avgViews = results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.views, 0) / results.length)
        : 0;
      const avgEngagement = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.engagementRate, 0) / results.length * 100) / 100
        : 0;
      
      // Get dominant formats and hook types
      const formatCounts: Record<string, number> = {};
      const hookCounts: Record<string, number> = {};
      for (const r of results) {
        if (r.formatType) formatCounts[r.formatType] = (formatCounts[r.formatType] || 0) + 1;
        if (r.hookType) hookCounts[r.hookType] = (hookCounts[r.hookType] || 0) + 1;
      }
      
      const dominantFormats = Object.entries(formatCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([f]) => f);
      const topHookTypes = Object.entries(hookCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([h]) => h);

      res.json({
        query: keyword,
        platforms,
        totalResults: results.length,
        profiles: Array.from(profiles.values()),
        videos: results.slice(0, limit),
        analytics: {
          avgViews,
          avgEngagement,
          dominantFormats,
          topHookTypes,
          bestPerformingDuration: "15-30s",
        },
        searchedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Competitive search error:", error);
      res.status(500).json({ error: "Failed to search competitive videos" });
    }
  });

  // Analyze specific competitor profile
  app.post("/api/competitive/profile", isAuthenticated, async (req: any, res) => {
    try {
      const { profileUrl, platform } = req.body;
      
      if (!profileUrl) {
        return res.status(400).json({ error: "Please provide a profile URL" });
      }

      // Extract username from URL
      let username = profileUrl;
      if (profileUrl.includes("tiktok.com")) {
        username = profileUrl.split("@")[1]?.split("/")[0]?.split("?")[0] || profileUrl;
      } else if (profileUrl.includes("instagram.com")) {
        username = profileUrl.split("instagram.com/")[1]?.split("/")[0]?.split("?")[0] || profileUrl;
      }

      const detectedPlatform = platform || (profileUrl.includes("tiktok") ? "tiktok" : "instagram");
      
      let profileData;
      if (detectedPlatform === "tiktok") {
        profileData = await scrapeTikTokProfile(username);
      } else {
        profileData = await scrapeInstagramProfile(username);
      }

      // Convert to competitive video format
      const videos = profileData.posts.map((post, index) => {
        const avgEngagement = profileData.posts.reduce((sum, p) => sum + p.engagement, 0) / profileData.posts.length;
        const outlierScore = avgEngagement > 0 ? Math.round((post.engagement / avgEngagement) * 10) / 10 : 1;
        
        return {
          id: post.id,
          platform: detectedPlatform,
          videoUrl: detectedPlatform === "tiktok" 
            ? `https://www.tiktok.com/@${username}/video/${post.id}`
            : `https://www.instagram.com/reel/${post.id}/`,
          thumbnailUrl: "",
          caption: post.text?.slice(0, 200) || "",
          creatorHandle: `@${username}`,
          creatorName: username,
          postedAt: post.timestamp,
          views: post.engagement * 10, // Estimate
          likes: Math.round(post.engagement * 0.7),
          comments: Math.round(post.engagement * 0.3),
          engagementRate: 5, // Estimate
          outlierScore,
          hookType: detectHookTypeFromText(post.text || ""),
          formatType: detectFormatTypeFromText(post.text || ""),
        };
      });

      res.json({
        profile: {
          id: username,
          platform: detectedPlatform,
          handle: `@${username}`,
          displayName: username,
          followers: 0,
          avgViews: videos.reduce((sum, v) => sum + v.views, 0) / videos.length,
          avgEngagement: 5,
          totalVideos: videos.length,
        },
        videos: videos.slice(0, 20),
        analyzedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Profile analysis error:", error);
      res.status(500).json({ error: "Failed to analyze profile" });
    }
  });

  // ==========================================
  // ADMIN ANALYTICS ENDPOINTS
  // ==========================================
  
  // Admin analytics dashboard data
  // RESTRICTED TO: danny@danielpaul.ai only
  const ADMIN_EMAIL = 'danny@danielpaul.ai';
  
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Get the current user to check admin status
      const currentUser = await storage.getUser(userId);
      const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      // Block access for non-admin users
      if (!isAdmin) {
        console.log(`[Admin] Access denied for non-admin user: ${currentUser?.email || currentUser?.username}`);
        return res.status(403).json({ error: "Admin access required. Only danny@danielpaul.ai can access this page." });
      }
      
      const db = await import("./db");
      const pool = db.pool;
      
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      // Also fetch users from Supabase Auth to get complete picture
      let supabaseUsers: any[] = [];
      try {
        const { supabase } = await import("./supabase");
        const { data, error } = await supabase.auth.admin.listUsers();
        if (!error && data?.users) {
          supabaseUsers = data.users;
          console.log(`[Admin] Fetched ${supabaseUsers.length} users from Supabase Auth`);
        }
      } catch (supabaseError) {
        console.error("[Admin] Could not fetch Supabase users:", supabaseError);
      }
      
      // Get user statistics with proper date filtering
      const userStats = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as new_yesterday
        FROM users
      `);
      
      // Get script statistics with active creators
      const scriptStats = await pool.query(`
        SELECT 
          COUNT(*) as total_scripts,
          COUNT(DISTINCT user_id) as users_with_scripts,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as scripts_today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as scripts_this_week,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as scripts_this_month
        FROM scripts
      `);
      
      // Get active users (users who generated scripts in timeframes)
      const activeUsersStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN s.created_at >= CURRENT_DATE THEN s.user_id END) as dau,
          COUNT(DISTINCT CASE WHEN s.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN s.user_id END) as wau,
          COUNT(DISTINCT CASE WHEN s.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN s.user_id END) as mau
        FROM scripts s
      `);
      
      // Get daily script generation for last 30 days
      const dailyScripts = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM scripts
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);
      
      // Get feature usage from user_usage table (cast TEXT to INTEGER)
      const featureUsage = await pool.query(`
        SELECT 
          COALESCE(SUM(CAST(scripts_generated AS INTEGER)), 0) as total_scripts_tracked,
          COALESCE(SUM(CAST(deep_research_used AS INTEGER)), 0) as deep_research_count,
          COALESCE(SUM(CAST(knowledge_base_queries AS INTEGER)), 0) as kb_queries_count
        FROM user_usage
      `);
      
      // Get conversion metrics (trial to paid)
      const conversionStats = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE plan = 'starter' OR plan IS NULL) as trial_users,
          COUNT(*) FILTER (WHERE plan IN ('pro', 'ultimate', 'agency')) as paid_users,
          COUNT(*) FILTER (WHERE plan = 'admin') as admin_users,
          COUNT(*) FILTER (WHERE trial_ends_at < NOW() AND (plan = 'starter' OR plan IS NULL)) as expired_trials
        FROM users
      `);
      
      // Get average scripts per user
      const avgScriptsPerUser = await pool.query(`
        SELECT 
          ROUND(COALESCE(AVG(script_count), 0), 1) as avg_scripts
        FROM (
          SELECT user_id, COUNT(*) as script_count 
          FROM scripts 
          GROUP BY user_id
        ) user_scripts
      `);
      
      // Get category breakdown from script parameters
      const categoryBreakdown = await pool.query(`
        SELECT 
          COALESCE(parameters->>'category', 'uncategorized') as category,
          COUNT(*) as count
        FROM scripts
        WHERE parameters IS NOT NULL
        GROUP BY parameters->>'category'
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Get platform preferences from script parameters
      const platformBreakdown = await pool.query(`
        SELECT 
          COALESCE(parameters->>'platform', 'tiktok') as platform,
          COUNT(*) as count
        FROM scripts
        WHERE parameters IS NOT NULL
        GROUP BY parameters->>'platform'
        ORDER BY count DESC
      `);
      
      // Get duration preferences
      const durationBreakdown = await pool.query(`
        SELECT 
          COALESCE(parameters->>'duration', '60') as duration,
          COUNT(*) as count
        FROM scripts
        WHERE parameters IS NOT NULL
        GROUP BY parameters->>'duration'
        ORDER BY count DESC
      `);
      
      // Get script tone preferences
      const toneBreakdown = await pool.query(`
        SELECT 
          COALESCE(parameters->>'tone', 'professional') as tone,
          COUNT(*) as count
        FROM scripts
        WHERE parameters IS NOT NULL
        GROUP BY parameters->>'tone'
        ORDER BY count DESC
        LIMIT 8
      `);
      
      // User retention: users who generated more than 1 script
      const retentionStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN script_count >= 2 THEN user_id END) as returning_users,
          COUNT(DISTINCT CASE WHEN script_count >= 5 THEN user_id END) as power_users,
          COUNT(DISTINCT CASE WHEN script_count >= 10 THEN user_id END) as super_users,
          COUNT(DISTINCT user_id) as total_active
        FROM (
          SELECT user_id, COUNT(*) as script_count 
          FROM scripts 
          GROUP BY user_id
        ) user_scripts
      `);
      
      // Scripts by hour of day (for usage patterns)
      const hourlyActivity = await pool.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as count
        FROM scripts
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);
      
      // Weekly retention cohorts (users created in each week who generated scripts)
      const weeklyCohorts = await pool.query(`
        SELECT 
          DATE_TRUNC('week', u.created_at) as cohort_week,
          COUNT(DISTINCT u.id) as users_signed_up,
          COUNT(DISTINCT s.user_id) as users_with_scripts
        FROM users u
        LEFT JOIN scripts s ON u.id = s.user_id
        WHERE u.created_at >= CURRENT_DATE - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', u.created_at)
        ORDER BY cohort_week DESC
        LIMIT 8
      `);
      
      // Get daily signups for the last 30 days
      const dailySignups = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);
      
      // Get subscription breakdown
      const subscriptionStats = await pool.query(`
        SELECT 
          COALESCE(plan, 'starter') as tier,
          COUNT(*) as count
        FROM users
        GROUP BY COALESCE(plan, 'starter')
      `);
      
      // Get recent users with full trial/plan details
      const recentUsers = await pool.query(`
        SELECT 
          id, 
          email, 
          username, 
          plan,
          trial_ends_at,
          trial_scripts_used,
          created_at,
          CASE 
            WHEN trial_ends_at IS NULL THEN 0
            WHEN trial_ends_at < NOW() THEN 0
            ELSE GREATEST(0, EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400)
          END as trial_days_remaining
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      // Get ALL users with detailed info for admin table (no limit)
      // Join with scripts table to get actual script counts
      const allUsersDetailed = await pool.query(`
        SELECT 
          u.id, 
          u.email, 
          u.username,
          u.plan,
          u.trial_ends_at,
          u.trial_scripts_used,
          u.created_at,
          COUNT(s.id) as actual_scripts_generated,
          CASE 
            WHEN u.trial_ends_at IS NULL THEN 0
            WHEN u.trial_ends_at < NOW() THEN 0
            ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (u.trial_ends_at - NOW())) / 86400))
          END as trial_days_remaining
        FROM users u
        LEFT JOIN scripts s ON u.id = s.user_id
        GROUP BY u.id, u.email, u.username, u.plan, u.trial_ends_at, u.trial_scripts_used, u.created_at
        ORDER BY u.created_at DESC
      `);
      
      // Get top active users (by script count)
      const activeUsers = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.username,
          COUNT(s.id) as script_count
        FROM users u
        LEFT JOIN scripts s ON u.id = s.user_id
        GROUP BY u.id, u.email, u.username
        ORDER BY script_count DESC
        LIMIT 10
      `);
      
      // Merge local DB users with Supabase users (avoiding duplicates by email)
      const localUsersMap = new Map<string, any>();
      allUsersDetailed.rows.forEach(row => {
        const email = row.email || row.username;
        if (email) localUsersMap.set(email.toLowerCase(), row);
      });
      
      // Add Supabase users that aren't in local DB
      // Calculate their trial days from Supabase created_at (signup date + 7 days)
      const supabaseOnlyUsers = supabaseUsers
        .filter(su => !localUsersMap.has((su.email || '').toLowerCase()))
        .map(su => {
          const createdAt = new Date(su.created_at);
          const trialEndsAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
          const now = new Date();
          const msRemaining = trialEndsAt.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
          
          return {
            id: su.id,
            email: su.email,
            username: su.email,
            plan: 'starter',
            tier: 'starter',
            scriptsUsed: 0, // No local tracking for these users yet
            trialDaysRemaining: daysRemaining,
            trialEndsAt: trialEndsAt.toISOString(),
            createdAt: su.created_at,
            source: 'supabase',
          };
        });
      
      // Format local users - use actual_scripts_generated for real count
      const localUsers = allUsersDetailed.rows.map(row => ({
        id: row.id,
        email: row.email,
        username: row.username,
        plan: row.plan || 'starter',
        tier: row.plan || 'starter',
        scriptsUsed: parseInt(row.actual_scripts_generated || row.trial_scripts_used || '0'),
        scriptsGenerated: parseInt(row.actual_scripts_generated || '0'),
        trialDaysRemaining: Math.ceil(parseFloat(row.trial_days_remaining || '0')),
        trialEndsAt: row.trial_ends_at,
        createdAt: row.created_at,
        source: 'local',
      }));
      
      // Combine all users
      const combinedUsers = [...localUsers, ...supabaseOnlyUsers]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Calculate total including Supabase-only users
      const totalUsers = parseInt(userStats.rows[0]?.total_users || '0') + supabaseOnlyUsers.length;
      
      res.json({
        users: {
          total: totalUsers,
          totalLocal: parseInt(userStats.rows[0]?.total_users || '0'),
          totalSupabase: supabaseUsers.length,
          supabaseOnly: supabaseOnlyUsers.length,
          newToday: parseInt(userStats.rows[0]?.new_today || '0'),
          newYesterday: parseInt(userStats.rows[0]?.new_yesterday || '0'),
          newThisWeek: parseInt(userStats.rows[0]?.new_this_week || '0'),
          newThisMonth: parseInt(userStats.rows[0]?.new_this_month || '0'),
        },
        scripts: {
          total: parseInt(scriptStats.rows[0]?.total_scripts || '0'),
          usersWithScripts: parseInt(scriptStats.rows[0]?.users_with_scripts || '0'),
          scriptsToday: parseInt(scriptStats.rows[0]?.scripts_today || '0'),
          scriptsThisWeek: parseInt(scriptStats.rows[0]?.scripts_this_week || '0'),
          scriptsThisMonth: parseInt(scriptStats.rows[0]?.scripts_this_month || '0'),
          avgPerUser: parseFloat(avgScriptsPerUser.rows[0]?.avg_scripts || '0'),
        },
        activity: {
          dau: parseInt(activeUsersStats.rows[0]?.dau || '0'),
          wau: parseInt(activeUsersStats.rows[0]?.wau || '0'),
          mau: parseInt(activeUsersStats.rows[0]?.mau || '0'),
        },
        conversion: {
          trialUsers: parseInt(conversionStats.rows[0]?.trial_users || '0'),
          paidUsers: parseInt(conversionStats.rows[0]?.paid_users || '0'),
          adminUsers: parseInt(conversionStats.rows[0]?.admin_users || '0'),
          expiredTrials: parseInt(conversionStats.rows[0]?.expired_trials || '0'),
          conversionRate: (parseInt(conversionStats.rows[0]?.paid_users || '0') + parseInt(conversionStats.rows[0]?.trial_users || '0')) > 0
            ? Math.round((parseInt(conversionStats.rows[0]?.paid_users || '0') / (parseInt(conversionStats.rows[0]?.trial_users || '0') + parseInt(conversionStats.rows[0]?.paid_users || '0'))) * 100)
            : 0,
        },
        featureUsage: {
          deepResearch: parseInt(featureUsage.rows[0]?.deep_research_count || '0'),
          knowledgeBase: parseInt(featureUsage.rows[0]?.kb_queries_count || '0'),
        },
        dailySignups: dailySignups.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
        })),
        dailyScripts: dailyScripts.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
        })),
        subscriptions: subscriptionStats.rows.map(row => ({
          tier: row.tier,
          count: parseInt(row.count),
        })),
        recentUsers: recentUsers.rows.map(row => ({
          id: row.id,
          email: row.email,
          username: row.username,
          tier: row.plan || 'starter',
          plan: row.plan || 'starter',
          scriptsUsed: parseInt(row.trial_scripts_used || '0'),
          trialDaysRemaining: Math.ceil(parseFloat(row.trial_days_remaining || '0')),
          trialEndsAt: row.trial_ends_at,
          createdAt: row.created_at,
        })),
        allUsers: combinedUsers,
        activeUsers: activeUsers.rows.map(row => ({
          id: row.id,
          email: row.email,
          username: row.username,
          scriptCount: parseInt(row.script_count),
        })),
        // Content Analytics
        contentAnalytics: {
          categories: categoryBreakdown.rows.map(row => ({
            category: row.category,
            count: parseInt(row.count),
          })),
          platforms: platformBreakdown.rows.map(row => ({
            platform: row.platform,
            count: parseInt(row.count),
          })),
          durations: durationBreakdown.rows.map(row => ({
            duration: row.duration,
            count: parseInt(row.count),
          })),
          tones: toneBreakdown.rows.map(row => ({
            tone: row.tone,
            count: parseInt(row.count),
          })),
        },
        // User Retention
        retention: {
          returningUsers: parseInt(retentionStats.rows[0]?.returning_users || '0'),
          powerUsers: parseInt(retentionStats.rows[0]?.power_users || '0'),
          superUsers: parseInt(retentionStats.rows[0]?.super_users || '0'),
          totalActive: parseInt(retentionStats.rows[0]?.total_active || '0'),
          returnRate: parseInt(retentionStats.rows[0]?.total_active || '0') > 0 
            ? Math.round((parseInt(retentionStats.rows[0]?.returning_users || '0') / parseInt(retentionStats.rows[0]?.total_active || '1')) * 100)
            : 0,
        },
        // Hourly activity pattern
        hourlyActivity: hourlyActivity.rows.map(row => ({
          hour: parseInt(row.hour),
          count: parseInt(row.count),
        })),
        // Weekly cohorts
        cohorts: weeklyCohorts.rows.map(row => ({
          week: row.cohort_week,
          signups: parseInt(row.users_signed_up),
          activated: parseInt(row.users_with_scripts),
          activationRate: parseInt(row.users_signed_up) > 0 
            ? Math.round((parseInt(row.users_with_scripts) / parseInt(row.users_signed_up)) * 100)
            : 0,
        })),
        generatedAt: new Date().toISOString(),
        // Include admin status for UI to show/hide admin-only features
        isAdmin: isAdmin,
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Admin endpoint to sync Supabase users to local database
  // This creates "shadow" local records for Supabase users who haven't logged in yet
  // RESTRICTED TO: danny@danielpaul.ai only
  app.post("/api/admin/sync-supabase-users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      // Security check: Only allow admin email to sync
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        console.log(`[Sync] Access denied for non-admin user: ${user.email || user.username}`);
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { supabase } = await import("./supabase");
      const db = await import("./db");
      const pool = db.pool;
      
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      // Fetch all users from Supabase Auth
      const { data: supabaseData, error: supabaseError } = await supabase.auth.admin.listUsers();
      
      if (supabaseError || !supabaseData?.users) {
        console.error("Failed to fetch Supabase users:", supabaseError);
        return res.status(500).json({ error: "Failed to fetch Supabase users" });
      }
      
      const supabaseUsers = supabaseData.users;
      console.log(`[Sync] Found ${supabaseUsers.length} users in Supabase Auth`);
      
      let synced = 0;
      let skipped = 0;
      let errors = 0;
      
      for (const su of supabaseUsers) {
        const email = su.email?.toLowerCase();
        if (!email) {
          skipped++;
          continue;
        }
        
        try {
          // Check if user already exists in local DB by email, username, or supabase_user_id
          const existingUser = await pool.query(
            `SELECT id FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR supabase_user_id = $2`,
            [email, su.id]
          );
          
          if (existingUser.rows.length > 0) {
            // User exists - update supabase_user_id if not set
            await pool.query(
              `UPDATE users SET supabase_user_id = $1 WHERE (LOWER(email) = $2 OR LOWER(username) = $2) AND supabase_user_id IS NULL`,
              [su.id, email]
            );
            skipped++;
            continue;
          }
          
          // Create new shadow user with trial data
          const createdAt = new Date(su.created_at);
          const trialEndsAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
          
          await pool.query(
            `INSERT INTO users (id, email, username, supabase_user_id, plan, trial_ends_at, trial_scripts_used, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $1, $2, 'starter', $3, 0, $4, NOW())
             ON CONFLICT (email) DO UPDATE SET supabase_user_id = EXCLUDED.supabase_user_id`,
            [email, su.id, trialEndsAt, createdAt]
          );
          
          synced++;
          console.log(`[Sync] Created shadow user for: ${email}`);
        } catch (e) {
          console.error(`[Sync] Error syncing user ${email}:`, e);
          errors++;
        }
      }
      
      console.log(`[Sync] Completed: ${synced} synced, ${skipped} skipped, ${errors} errors`);
      
      res.json({
        success: true,
        message: `Synced ${synced} new users from Supabase`,
        stats: {
          totalSupabase: supabaseUsers.length,
          synced,
          skipped,
          errors,
        },
      });
    } catch (error) {
      console.error("Sync Supabase users error:", error);
      res.status(500).json({ error: "Failed to sync Supabase users" });
    }
  });

  // Admin endpoint to recover stuck users by syncing their Stripe subscription
  // This finds users by email in Stripe and syncs their subscription to our DB
  // RESTRICTED TO: danny@danielpaul.ai only
  app.post("/api/admin/recover-stripe-user", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user?.id;
      const admin = await storage.getUser(adminId);
      
      if (!admin || admin.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      console.log(`[Recovery] Admin ${admin.email} recovering user: ${email}`);
      
      const { stripeService } = await import("./stripeService");
      const stripe = await stripeService.getStripeClient();
      
      // Search for customer by email in Stripe
      const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
      
      if (customers.data.length === 0) {
        return res.status(404).json({ error: "No Stripe customer found with this email" });
      }
      
      const stripeCustomer = customers.data[0];
      console.log(`[Recovery] Found Stripe customer: ${stripeCustomer.id}`);
      
      // Get their subscriptions
      const subscriptions = await stripe.subscriptions.list({ 
        customer: stripeCustomer.id,
        status: 'all',
        limit: 1
      });
      
      if (subscriptions.data.length === 0) {
        return res.status(404).json({ error: "No subscriptions found for this customer" });
      }
      
      const subscription = subscriptions.data[0] as any;
      console.log(`[Recovery] Found subscription: ${subscription.id}, status: ${subscription.status}`);
      
      // Check if local user exists
      let localUser = await storage.getUserByUsername(email.toLowerCase());
      
      if (!localUser) {
        // Create the local user record
        console.log(`[Recovery] Creating local user record for: ${email}`);
        localUser = await storage.createUser({
          username: email.toLowerCase(),
          password: 'supabase-auth-only', // Placeholder, auth is via Supabase
        });
        console.log(`[Recovery] Created local user: ${localUser.id}`);
      }
      
      // Sync subscription to local user
      await storage.updateUserStripeCustomer(localUser.id, stripeCustomer.id);
      
      const trialEndsAt = subscription.status === 'trialing' && subscription.trial_end 
        ? new Date(subscription.trial_end * 1000)
        : undefined;
      
      await storage.updateUserSubscription(localUser.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        plan: 'starter',
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
        trialEndsAt,
      });
      
      // Check if we need to create a Supabase user for them
      let supabaseUserCreated = false;
      let passwordResetSent = false;
      
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        // Check if Supabase user exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        
        if (!existingUser) {
          // Create Supabase user with a temporary random password (user will need to reset)
          const tempPassword = randomUUID().slice(0, 16) + 'Aa1!'; // Meets password requirements
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase(),
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
          });
          
          if (createError) {
            console.error(`[Recovery] Failed to create Supabase user:`, createError);
          } else {
            supabaseUserCreated = true;
            console.log(`[Recovery] Created Supabase user: ${newUser?.user?.id}`);
            
            // Link Supabase user ID to local record
            if (newUser?.user?.id && db) {
              await db.execute(
                sql`UPDATE users SET supabase_user_id = ${newUser.user.id} WHERE id = ${localUser.id}`
              );
            }
          }
        } else {
          console.log(`[Recovery] Supabase user already exists: ${existingUser.id}`);
          // Link existing Supabase user if not already linked
          if (db) {
            await db.execute(
              sql`UPDATE users SET supabase_user_id = ${existingUser.id} WHERE id = ${localUser.id} AND supabase_user_id IS NULL`
            );
          }
        }
        
        // Trigger password reset email
        const { supabase } = await import("./supabase");
        let redirectUrl = 'https://viralscript.co/reset-password';
        if (process.env.REPLIT_DOMAINS) {
          const domain = process.env.REPLIT_DOMAINS.split(',')[0];
          redirectUrl = `https://${domain}/reset-password`;
        }
        
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
          redirectTo: redirectUrl,
        });
        
        if (!resetError) {
          passwordResetSent = true;
          console.log(`[Recovery] Password reset email sent to: ${email}`);
        } else {
          console.error(`[Recovery] Failed to send password reset:`, resetError);
        }
      } catch (supabaseError) {
        console.error(`[Recovery] Supabase operations error:`, supabaseError);
      }
      
      console.log(`[Recovery] Successfully synced subscription for user: ${email}`);
      
      res.json({
        success: true,
        message: `Successfully recovered user ${email}`,
        user: {
          id: localUser.id,
          email: email,
          stripeCustomerId: stripeCustomer.id,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        },
        supabaseUserCreated,
        passwordResetSent,
      });
    } catch (error: any) {
      console.error("[Recovery] Error:", error);
      res.status(500).json({ error: "Failed to recover user", details: error?.message });
    }
  });

  return httpServer;
}

// Helper functions for competitive analysis
function detectHookTypeFromText(text: string): string {
  const lower = text.toLowerCase();
  const firstLine = text.split(/[\n.!?]/)[0] || "";
  
  if (/\?$/.test(firstLine)) return "question";
  if (/\d+%|\d+x|\$\d+|\d+k|\d+ (million|billion)/i.test(firstLine)) return "statistic";
  if (/stop|don't|wrong|never|actually|myth|nobody/i.test(lower.slice(0, 100))) return "contrarian";
  if (/i was|i used to|my|when i|i just/i.test(lower.slice(0, 50))) return "personal";
  if (/try this|do this|here's how|watch this|secret/i.test(lower.slice(0, 50))) return "secret";
  if (/\d+\s*(things?|ways?|tips?|steps?|reasons?)/i.test(firstLine)) return "list";
  
  return "hook";
}

function detectFormatTypeFromText(text: string): string {
  const lower = text.toLowerCase();
  
  if (/\d+\s*(things?|ways?|tips?|steps?|reasons?)/i.test(text)) return "listicle";
  if (/how to|step \d|first,|then,|next,/i.test(text)) return "tutorial";
  if (/story|journey|i was|i used to/i.test(lower)) return "story";
  if (/pov:|unpopular opinion|hot take/i.test(lower)) return "pov";
  if (/\?/.test(text.split(/[.!]/)[0] || "")) return "question";
  
  return "educational";
}

// Search Instagram by keyword/hashtag
async function searchInstagramByKeyword(keyword: string, limit: number = 10): Promise<{
  posts: Array<{
    id: string;
    text: string;
    views: number;
    likes: number;
    comments: number;
    author: string;
    timestamp: string;
    thumbnailUrl: string;
  }>;
}> {
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
  if (!APIFY_TOKEN) {
    return { posts: [] };
  }

  try {
    const { ApifyClient } = await import("apify-client");
    const client = new ApifyClient({ token: APIFY_TOKEN });

    const input = {
      search: keyword.replace(/\s+/g, ""),
      searchType: "hashtag",
      resultsLimit: limit,
    };

    const run = await client.actor("apify/instagram-scraper").call(input, {
      waitSecs: 120,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    interface IGPost {
      id: string;
      caption?: string;
      likesCount?: number;
      commentsCount?: number;
      videoViewCount?: number;
      ownerUsername?: string;
      timestamp?: string;
      displayUrl?: string;
    }

    const posts = (items as unknown as IGPost[])
      .filter((item) => item.caption)
      .map((item) => ({
        id: item.id,
        text: item.caption || "",
        views: item.videoViewCount || (item.likesCount || 0) * 10,
        likes: item.likesCount || 0,
        comments: item.commentsCount || 0,
        author: item.ownerUsername || "unknown",
        timestamp: item.timestamp || new Date().toISOString(),
        thumbnailUrl: item.displayUrl || "",
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return { posts };
  } catch (error) {
    console.error("Instagram search error:", error);
    return { posts: [] };
  }
}
