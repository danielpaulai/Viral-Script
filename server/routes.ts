import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import multer from "multer";
import { setupAuth, isAuthenticated, setupPasswordReset } from "./auth";
import { extractTextFromFile, truncateText, SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from "./ocr-utils";

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
} from "@shared/schema";
import { getCreatorById, creatorStyles as comprehensiveCreatorStyles } from "@shared/creator-styles";
import { scrapeTikTokProfile, scrapeInstagramProfile, analyzeCreatorStyle, searchTikTokByKeyword } from "./apify";

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
];

// Helper function to check for fluff in script
function containsFluff(script: string): boolean {
  const lowerScript = script.toLowerCase();
  return bannedFluffyPhrases.some(phrase => lowerScript.includes(phrase.toLowerCase()));
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
  
  const selectedCta = params.selectedCtaId 
    ? ctaOptions.find(c => c.id === params.selectedCtaId)?.text 
    : null;
  const finalCta = params.customCta || selectedCta || params.callToAction || "Follow for more.";

  const wordTargets: Record<string, { min: number; max: number }> = {
    "15": { min: 30, max: 45 },
    "30": { min: 60, max: 90 },
    "60": { min: 120, max: 180 },
    "90": { min: 180, max: 270 },
    "180": { min: 360, max: 540 },
  };
  const targetWords = wordTargets[params.duration] || wordTargets["60"];

  let researchContext = "";
  let referenceAnalysis = "";
  const kbContext = knowledgeBaseDocs ? buildKnowledgeBaseContext(knowledgeBaseDocs) : "";
  
  if (params.deepResearch) {
    try {
      const researchResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a viral content researcher. Research the given topic and provide:
1. 3-5 surprising statistics or data points with sources
2. 2-3 expert quotes or insights from credible people
3. 1-2 contrarian takes that challenge common beliefs  
4. Real-world examples or case studies
5. Common mistakes people make and why

Keep responses concise and factual. Cite sources where possible.`
          },
          {
            role: "user",
            content: `Research this topic for a short-form video script: "${params.topic}"
${params.targetAudience ? `Target audience: ${params.targetAudience}` : ""}
${params.keyFacts ? `Known facts to include: ${params.keyFacts}` : ""}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });
      researchContext = researchResponse.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Research failed, continuing without deep research:", error);
    }
  }

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

  // Reference script instructions
  const referenceInstructions = referenceAnalysis ? `
REFERENCE SCRIPT ANALYSIS - MATCH THIS STYLE:
${referenceAnalysis}

Generate a NEW script about the user's topic that follows these same patterns but with original content.
` : "";

  const systemPrompt = `You are a world-class short-form video scriptwriter who writes like a real human, NOT an AI.
${creatorStyleInstructions ? `
=== CREATOR STYLE EMULATION (HIGHEST PRIORITY) ===
${creatorStyleInstructions}
You MUST emulate this creator's exact style, including their signature phrases, hook patterns, sentence structure, and energy. This takes precedence over general rules below when there's a conflict.
=== END CREATOR STYLE ===
` : ''}
CRITICAL RULES - FOLLOW EXACTLY:
1. TOPIC RELEVANCE (MOST IMPORTANT): Your script MUST be 100% about the EXACT topic provided. Every sentence must directly relate to the topic. Do NOT go off on tangents. Do NOT write about something else. If the topic is "How to get leads from LinkedIn" - EVERY sentence must be about LinkedIn lead generation.

2. READING LEVEL: Grade 3-6 reading level. Use simple, everyday words. Short sentences. No jargon.
3. SOUND HUMAN: Write like you're texting a friend. Use contractions. Be casual. No corporate speak.
4. CTA: You MUST use the EXACT CTA provided by the user. Copy it word-for-word. Do NOT create your own CTA.
5. ONE IDEA PER SENTENCE: Never combine multiple thoughts in one sentence.
6. BANNED WORDS - NEVER USE: ${aiWordsToAvoid.join(", ")}

<output_quality_rules>
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

4. GET TO THE POINT
- Hook in first 2 seconds (first sentence)
- Main value by second 3-5
- No long intros or build-ups
- Every sentence must earn its place

5. END WITH CLEAR NEXT STEP
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
</quality_check>

Style guidelines:
- One short sentence per line
- Include specific numbers and examples when available
- Create tension, curiosity, or emotional connection
- Use pattern interrupts to maintain attention

VIDEO TYPE: ${videoType.name}
${videoTypeInstructions[videoType.id] || videoTypeInstructions.talking_head}

${videoType.id === "talking_head" ? `IMPORTANT: Structure your script with EXACTLY these three sections:

**HOOK**
(First 3 seconds - must stop the scroll. One powerful opening line.)

**BODY**
(The main content - insights, steps, revelations. Keep it punchy and valuable.)

**CTA**
(Call to action - what you want them to do next.)

Use these exact labels.` : ""}

Do NOT include hashtags unless specified. Separate each line with a blank line for clarity.
${referenceInstructions}`;

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

  const userPrompt = `Write a ${params.duration}-second video script (aim for ${targetWords.min}-${targetWords.max} words).

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
    
    // Retry loop for quality validation
    while (attempts < maxAttempts && (gradeLevel > 5 || !ctaValid || hasFluff || !actionabilityCheck.actionable || !topicRelevance.relevant || !specificityCheck.specific || !wordCountValid)) {
      attempts++;
      const temperature = attempts === 1 ? 0.8 : 0.6; // Lower temperature on retries
      
      // Build specific retry hints based on what failed
      let retryHints: string[] = [];
      if (attempts > 1) {
        if (!wordCountValid) {
          if (currentWordCount < targetWords.min) {
            retryHints.push(`SCRIPT IS TOO SHORT! You wrote ${currentWordCount} words but need ${targetWords.min}-${targetWords.max} words for a ${params.duration}-second video. ADD MORE CONTENT.`);
          } else if (currentWordCount > targetWords.max) {
            retryHints.push(`SCRIPT IS TOO LONG! You wrote ${currentWordCount} words but need only ${targetWords.min}-${targetWords.max} words for a ${params.duration}-second video. CUT IT DOWN.`);
          }
        }
        if (!topicRelevance.relevant) retryHints.push(`STAY ON TOPIC! Your script must be about "${params.topic}". Every sentence must relate to this topic. You only matched ${topicRelevance.matchedKeywords}/${topicRelevance.totalKeywords} topic keywords.`);
        if (!specificityCheck.specific) {
          const issues: string[] = [];
          if (specificityCheck.numberCount < 2) issues.push(`ADD MORE SPECIFIC NUMBERS! You only have ${specificityCheck.numberCount} - need at least 2 stats/percentages/timeframes.`);
          if (specificityCheck.genericWords.length > 2) issues.push(`REMOVE GENERIC WORDS: ${specificityCheck.genericWords.slice(0, 3).join(', ')}. Replace with specific names, numbers, or examples.`);
          retryHints.push(issues.join(' '));
        }
        if (gradeLevel > 5) retryHints.push('USE SIMPLER WORDS AND SHORTER SENTENCES.');
        if (!ctaValid) retryHints.push('USE THE EXACT CTA PROVIDED - COPY IT WORD FOR WORD.');
        if (hasFluff) retryHints.push('REMOVE ALL FLUFFY PHRASES. Get straight to the point. No "In today\'s world" or "The truth is".');
        if (!actionabilityCheck.actionable) {
          retryHints.push(`MAKE IT MORE ACTIONABLE: ${actionabilityCheck.reasons.join(', ')}. Include specific numbers, timeframes, and clear next steps.`);
        }
      }
      
      const retryHint = retryHints.length > 0 
        ? `\n\nPREVIOUS ATTEMPT FAILED QUALITY CHECK:\n${retryHints.join('\n')}\n\nRewrite with these fixes.`
        : '';
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt + retryHint }
        ],
        max_tokens: 1500,
        temperature,
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
      wordCountValid = currentWordCount >= targetWords.min && currentWordCount <= targetWords.max;
      
      console.log(`Script generation attempt ${attempts}: words=${currentWordCount} (target ${targetWords.min}-${targetWords.max}), grade=${gradeLevel.toFixed(1)}, ctaValid=${ctaValid}, hasFluff=${hasFluff}, actionable=${actionabilityCheck.actionable}, topicRelevant=${topicRelevance.relevant} (${topicRelevance.matchedKeywords}/${topicRelevance.totalKeywords}), specific=${specificityCheck.specific} (${specificityCheck.numberCount} numbers, ${specificityCheck.genericWords.length} generic words)`);
    }
    
    // If we still failed validation after max attempts, log warning but continue
    if (!wordCountValid) {
      console.warn(`Word count validation failed: ${currentWordCount} words (target ${targetWords.min}-${targetWords.max}) after ${maxAttempts} attempts`);
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
    let coherenceCheck = { coherent: false, issues: [] as string[], suggestions: [] as string[] };
    let coherenceAttempts = 0;
    const maxCoherenceAttempts = 2;
    
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

  // Generate CTAs based on hook, problem, and solution
  app.post("/api/cta/generate", async (req: any, res) => {
    try {
      const { hook, problem, solution, videoPurpose, targetAudience } = req.body;
      
      if (!hook || !problem || !solution) {
        return res.status(400).json({ message: "Hook, problem, and solution are required" });
      }

      const purposeGuidance = {
        authority: "Position the creator as an expert - CTAs should invite deeper engagement like following for more insights or commenting with questions",
        education: "Reinforce the learning value - CTAs should encourage saving the video, sharing with others who need this, or taking immediate action",
        storytelling: "Build emotional connection - CTAs should invite personal stories, shares, or follow-ups for part 2"
      };

      const prompt = `You are a viral short-form video CTA expert. Generate 3 unique, conversational call-to-actions based on this video's content.

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

  app.post("/api/scripts/generate", async (req: any, res) => {
    try {
      const params: ScriptParameters = req.body;
      const userId = req.user?.id;
      
      // Check trial status for authenticated users
      if (userId) {
        const trialStatus = await storage.checkTrialStatus(userId);
        if (trialStatus.trialEnded) {
          return res.status(403).json({ 
            error: "Trial ended", 
            message: "Your free trial has ended. Please upgrade to continue generating scripts.",
            trialStatus
          });
        }
        if (trialStatus.scriptsRemaining <= 0) {
          return res.status(403).json({ 
            error: "Script limit reached", 
            message: "You've used all 20 scripts in your free trial. Please upgrade to continue.",
            trialStatus
          });
        }
      }
      
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
      
      // Extract CTA from original script (last section after **CTA**)
      const extractCta = (text: string): string => {
        const ctaMatch = text.match(/\*\*CTA\*\*[\s\S]*$/i);
        return ctaMatch ? ctaMatch[0].trim() : '';
      };
      
      const originalCta = extractCta(script);
      
      let enhancedScript = script;
      let attempts = 0;
      const maxAttempts = 2;
      let gradeLevel = 10;
      
      while (attempts < maxAttempts && gradeLevel > 5) {
        attempts++;
        const temperature = attempts === 1 ? 0.7 : 0.5;
        const retryHint = attempts > 1 ? '\n\nPREVIOUS ATTEMPT HAD COMPLEX LANGUAGE. USE MUCH SIMPLER WORDS.' : '';
        
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
5. SAME LENGTH: Stay within 20% of original word count.
6. BANNED WORDS: leverage, unleash, game-changer, revolutionary, elevate, empower, unlock, transform, cutting-edge, dive in, unpack, seamlessly

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
        
        console.log(`Enhancement attempt ${attempts}: grade=${gradeLevel.toFixed(1)}`);
      }
      
      // Calculate final metrics
      const words = enhancedScript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      
      res.json({
        enhancedScript,
        wordCount,
        gradeLevel: Math.round(gradeLevel * 10) / 10,
        enhancementType: enhancementType || 'general',
      });
    } catch (error) {
      console.error("Error enhancing script:", error);
      res.status(500).json({ error: "Failed to enhance script" });
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
      
      // Hook strength analysis
      const hookPatterns = [/^stop/i, /^don't/i, /^why/i, /^how/i, /^what if/i, /\?$/, /^here's/i, /^the \d+/i, /^i\s/i, /^\d+/];
      const hookStrength = hookPatterns.filter(p => p.test(firstLine)).length;
      
      // Specificity analysis - count numbers and specific details
      const numberMatches = script.match(/\d+/g) || [];
      const specificityScore = Math.min(25, numberMatches.length * 5);
      
      // Engagement patterns
      const engagementPatterns = [/\byou\b/i, /\byour\b/i, /\bbecause\b/i, /\bnow\b/i, /\btoday\b/i];
      const engagementMatches = engagementPatterns.filter(p => p.test(scriptLower)).length;
      
      // Identify weak areas
      const weakAreas: string[] = [];
      if (gradeLevel > 6) weakAreas.push("reading_level");
      if (hookStrength < 2) weakAreas.push("hook");
      if (specificityScore < 15) weakAreas.push("specificity");
      if (engagementMatches < 3) weakAreas.push("engagement");
      if (avgWordsPerSentence > 12) weakAreas.push("sentence_length");
      
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
      
      // Build improvement instructions based on weak areas
      const improvementInstructions: string[] = [];
      if (weakAreas.includes("reading_level")) {
        improvementInstructions.push("SIMPLIFY LANGUAGE: Use grade 3 reading level. Replace complex words with simple ones. Max 8 words per sentence.");
      }
      if (weakAreas.includes("hook")) {
        improvementInstructions.push("STRENGTHEN HOOK: The first line must stop the scroll. Use a contrarian take, shocking stat, or direct question. Make it impossible to ignore.");
      }
      if (weakAreas.includes("specificity")) {
        improvementInstructions.push("ADD SPECIFICS: Include exact numbers, real examples, and concrete details. Replace vague claims with precise data.");
      }
      if (weakAreas.includes("engagement")) {
        improvementInstructions.push("BOOST ENGAGEMENT: Add more 'you' and 'your'. Create curiosity gaps. Add pattern interrupts.");
      }
      if (weakAreas.includes("sentence_length")) {
        improvementInstructions.push("SHORTEN SENTENCES: Break long sentences into 2-3 shorter ones. One idea per sentence. Faster rhythm.");
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a viral content optimization expert. Your job is to boost the virality score of scripts.

CRITICAL RULES:
1. KEEP THE EXACT SAME CTA - Do NOT change the call-to-action section at all
2. KEEP THE SAME STRUCTURE - Maintain HOOK, BODY, CTA format
3. KEEP SIMILAR LENGTH - Stay within 15% of original word count
4. SOUND HUMAN - Write like a real person, not an AI
5. NO AI WORDS: Never use leverage, unlock, dive into, game-changing, elevate, empower, unlock, transform

${viralContext}

SPECIFIC IMPROVEMENTS NEEDED:
${improvementInstructions.join('\n\n')}

Return ONLY the improved script with no explanations.`
          },
          {
            role: "user",
            content: `Boost the virality of this script:

${script}

Focus on the weak areas identified. Return ONLY the improved script.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });
      
      const boostedScript = response.choices[0]?.message?.content || script;
      
      // Calculate new metrics
      const newWords = boostedScript.split(/\s+/).filter(Boolean);
      const newSentences = boostedScript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const newAvgWordsPerSentence = newWords.length / Math.max(1, newSentences.length);
      const newGradeLevel = Math.max(3, Math.min(12, 0.39 * newAvgWordsPerSentence + 4));
      
      // Calculate new hook strength
      const newFirstLine = boostedScript.split('\n')[0] || '';
      const newHookStrength = hookPatterns.filter(p => p.test(newFirstLine)).length;
      
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

      // Check if user has Pro subscription
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "This feature requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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

      // Check if user has Pro subscription
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Deep Research requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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
7. Vary the approach - give 4 distinctly different conversational hooks
8. Consider the platform (${platform || 'TikTok'}) - shorter for TikTok, can be slightly longer for YouTube

Respond with a JSON array of exactly 4 hooks:
[
  {"hook": "The conversational hook text", "reasoning": "Why this grabs attention and sounds spoken"},
  {"hook": "Another option", "reasoning": "Explanation"},
  {"hook": "Third option", "reasoning": "Explanation"},
  {"hook": "Fourth option", "reasoning": "Explanation"}
]`;

      const userPrompt = `Generate 4 CONVERSATIONAL hooks for this video:

VIDEO TYPE: ${videoPurpose || 'education'}
PROBLEM the video addresses: ${problem || 'Not specified'}
SOLUTION/TEACHING the video offers: ${solution || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'General creators'}
PLATFORM: ${platform || 'TikTok'}
DURATION: ${duration || '60s'}

Create 4 distinctly different hooks in the "${hookCategory?.name || hookStyle}" style. 
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
        const normalizedHooks = (Array.isArray(hooks) ? hooks : []).slice(0, 4).map((h: any, i: number) => ({
          id: `hook_${i + 1}`,
          hook: h.hook || h.text || `Hook option ${i + 1}`,
          reasoning: h.reasoning || h.why || "AI-generated hook",
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
      
      // Check if user has Pro subscription for Knowledge Base
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Knowledge Base requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
      }

      const docs = await storage.getKnowledgeBaseDocs(userId);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge base documents" });
    }
  });

  app.get("/api/knowledge-base/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Check if user has Pro subscription for Knowledge Base
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Knowledge Base requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
      }

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
      
      // Check if user has Pro subscription for Knowledge Base
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Knowledge Base requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
      }

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
      
      // Check if user has Pro subscription for Knowledge Base
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Knowledge Base requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
      }

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
      
      // Check if user has Pro subscription for Knowledge Base
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Knowledge Base requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
      }

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

      // Check if user has Pro subscription for Knowledge Base
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Knowledge Base requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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

  // Trial Status endpoint
  app.get("/api/user/trial-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }
      const trialStatus = await storage.checkTrialStatus(userId);
      const user = await storage.getUser(userId);
      
      // Map backend response to frontend expected format
      res.json({
        isActive: trialStatus.isOnTrial && !trialStatus.trialEnded,
        daysRemaining: trialStatus.daysRemaining,
        scriptsUsed: user?.trialScriptsUsed || 0,
        scriptsLimit: 20,
        trialEndsAt: user?.trialEndsAt || null,
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

      // Check if user has Pro or Agency plan
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "This feature requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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

      // Check if user has Pro subscription
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Viral Examples requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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

      // Check if user has Pro subscription
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Strategic Insights requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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

      // Check if user has Pro subscription
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "Instagram Viral Examples requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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

      // Check if user has Pro or Agency plan
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "agency")) {
        return res.status(403).json({ 
          error: "This feature requires a Pro or Agency subscription",
          requiresPlan: "pro"
        });
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
  app.get("/api/admin/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // For now, allow any authenticated user to see stats
      // In production, you'd check for admin role
      // TODO: Add admin role check when role system is implemented
      
      const db = await import("./db");
      const pool = db.pool;
      
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      // Get user statistics
      const userStats = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as new_today,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM users
      `);
      
      // Get script statistics
      const scriptStats = await pool.query(`
        SELECT 
          COUNT(*) as total_scripts,
          COUNT(DISTINCT user_id) as users_with_scripts,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as scripts_today,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as scripts_this_week
        FROM scripts
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
          COALESCE(subscription_tier, 'trial') as tier,
          COUNT(*) as count
        FROM users
        GROUP BY COALESCE(subscription_tier, 'trial')
      `);
      
      // Get recent users with full trial/plan details
      const recentUsers = await pool.query(`
        SELECT 
          id, 
          email, 
          username, 
          plan,
          subscription_tier,
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
      
      // Get all users with detailed info for admin table
      const allUsersDetailed = await pool.query(`
        SELECT 
          id, 
          email, 
          username,
          plan,
          subscription_tier,
          trial_ends_at,
          trial_scripts_used,
          created_at,
          CASE 
            WHEN trial_ends_at IS NULL THEN 0
            WHEN trial_ends_at < NOW() THEN 0
            ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 86400))
          END as trial_days_remaining
        FROM users
        ORDER BY created_at DESC
        LIMIT 50
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
      
      res.json({
        users: {
          total: parseInt(userStats.rows[0]?.total_users || '0'),
          newToday: parseInt(userStats.rows[0]?.new_today || '0'),
          newThisWeek: parseInt(userStats.rows[0]?.new_this_week || '0'),
          newThisMonth: parseInt(userStats.rows[0]?.new_this_month || '0'),
        },
        scripts: {
          total: parseInt(scriptStats.rows[0]?.total_scripts || '0'),
          usersWithScripts: parseInt(scriptStats.rows[0]?.users_with_scripts || '0'),
          scriptsToday: parseInt(scriptStats.rows[0]?.scripts_today || '0'),
          scriptsThisWeek: parseInt(scriptStats.rows[0]?.scripts_this_week || '0'),
        },
        dailySignups: dailySignups.rows.map(row => ({
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
          tier: row.subscription_tier || row.plan || 'trial',
          plan: row.plan || 'starter',
          scriptsUsed: parseInt(row.trial_scripts_used || '0'),
          trialDaysRemaining: Math.ceil(parseFloat(row.trial_days_remaining || '0')),
          trialEndsAt: row.trial_ends_at,
          createdAt: row.created_at,
        })),
        allUsers: allUsersDetailed.rows.map(row => ({
          id: row.id,
          email: row.email,
          username: row.username,
          plan: row.plan || 'starter',
          tier: row.subscription_tier || row.plan || 'trial',
          scriptsUsed: parseInt(row.trial_scripts_used || '0'),
          trialDaysRemaining: Math.ceil(parseFloat(row.trial_days_remaining || '0')),
          trialEndsAt: row.trial_ends_at,
          createdAt: row.created_at,
        })),
        activeUsers: activeUsers.rows.map(row => ({
          id: row.id,
          email: row.email,
          username: row.username,
          scriptCount: parseInt(row.script_count),
        })),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
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
