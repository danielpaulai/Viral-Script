import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import multer from "multer";
import { setupAuth } from "./auth";
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
  type ScriptParameters,
  type GeneratedScript,
  type KnowledgeBaseDoc,
} from "@shared/schema";
import { getCreatorById, creatorStyles as comprehensiveCreatorStyles } from "@shared/creator-styles";
import { scrapeTikTokProfile, scrapeInstagramProfile, analyzeCreatorStyle } from "./apify";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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

async function generateScriptWithAI(params: ScriptParameters, knowledgeBaseDocs?: KnowledgeBaseDoc[]): Promise<GeneratedScript> {
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

CRITICAL RULES - FOLLOW EXACTLY:
1. READING LEVEL: Grade 3 reading level. Use simple, everyday words. Short sentences (5-10 words max). No jargon.
2. SOUND HUMAN: Write like you're texting a friend. Use contractions. Be casual. No corporate speak.
3. CTA: You MUST use the EXACT CTA provided by the user. Copy it word-for-word. Do NOT create your own CTA.
4. ONE IDEA PER SENTENCE: Never combine multiple thoughts in one sentence.
5. BANNED WORDS - NEVER USE: ${aiWordsToAvoid.join(", ")}

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

3. AVOID FLUFF PHRASES - NEVER USE:
- "In today's world..."
- "Have you ever wondered..."
- "Let me tell you something..."
- "The truth is..."
- "Here's the thing..."
- "At the end of the day..."
- "It's important to remember..."
- "What most people don't realize..."

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
${creatorStyleInstructions}
${referenceInstructions}`;

  const userPrompt = `Write a ${params.duration}-second video script (aim for ${targetWords.min}-${targetWords.max} words).

${knowledgeBaseInstructions}
TOPIC: ${params.topic}
VIDEO TYPE: ${videoType.name} - ${videoType.description}
${creatorStyle.id !== "default" ? `CREATOR STYLE: ${creatorStyle.name} - ${creatorStyle.description}` : ""}
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

${researchContext ? `RESEARCH FINDINGS TO INCORPORATE:
${researchContext}

Use these research findings to make your script more specific. Include real data and examples.` : ""}

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

  try {
    let scriptContent = "";
    let attempts = 0;
    const maxAttempts = 3;
    let gradeLevel = 10; // Start high to trigger validation
    let ctaValid = false;
    let hasFluff = true;
    let actionabilityCheck = { actionable: false, reasons: ["Not checked yet"] };
    
    // Retry loop for quality validation
    while (attempts < maxAttempts && (gradeLevel > 5 || !ctaValid || hasFluff || !actionabilityCheck.actionable)) {
      attempts++;
      const temperature = attempts === 1 ? 0.8 : 0.6; // Lower temperature on retries
      
      // Build specific retry hints based on what failed
      let retryHints: string[] = [];
      if (attempts > 1) {
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
      
      console.log(`Script generation attempt ${attempts}: grade=${gradeLevel.toFixed(1)}, ctaValid=${ctaValid}, hasFluff=${hasFluff}, actionable=${actionabilityCheck.actionable}`);
    }
    
    // If we still failed validation after max attempts, log warning but continue
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
    
    const words = scriptContent.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

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

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  
  app.get("/api/ctas", (req, res) => {
    res.json({
      categories: ctaCategories,
      options: ctaOptions,
    });
  });

  app.post("/api/scripts/generate", async (req: any, res) => {
    try {
      const params: ScriptParameters = req.body;
      const userId = req.user?.id;
      
      let knowledgeBaseDocs: KnowledgeBaseDoc[] = [];
      if (params.useKnowledgeBase && userId) {
        // Get user-specific knowledge base if authenticated
        knowledgeBaseDocs = await storage.getKnowledgeBaseDocs(userId);
      }
      
      const generatedScript = await generateScriptWithAI(params, knowledgeBaseDocs);
      
      const savedScript = await storage.createScript({
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

  // Competitor Research: Scrape top-performing TikTok content for a topic
  app.post("/api/research/competitors", async (req, res) => {
    try {
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

  // Deep Research: Expand raw topic into detailed brief
  app.post("/api/scripts/expand-topic", async (req, res) => {
    try {
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

  app.get("/api/scripts", async (req, res) => {
    try {
      const scripts = await storage.getScripts();
      res.json(scripts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  app.get("/api/scripts/:id", async (req, res) => {
    try {
      const script = await storage.getScript(req.params.id);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch script" });
    }
  });

  app.delete("/api/scripts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScript(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const project = await storage.createProject({ name, description });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.post("/api/projects/scripts", async (req, res) => {
    try {
      const { projectId, scriptId } = req.body;
      if (!scriptId) {
        return res.status(400).json({ error: "Script ID is required" });
      }
      
      const script = await storage.getScript(scriptId);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      
      await storage.addScriptToProject(projectId, scriptId);
      res.json({ success: true, message: "Script added to project" });
    } catch (error) {
      res.status(500).json({ error: "Failed to add script to project" });
    }
  });

  app.get("/api/vault", async (req, res) => {
    try {
      const items = await storage.getVaultItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vault items" });
    }
  });

  app.post("/api/vault", async (req, res) => {
    try {
      const { scriptId, name } = req.body;
      if (!scriptId || !name) {
        return res.status(400).json({ error: "Script ID and name are required" });
      }
      const item = await storage.createVaultItem({ scriptId, name });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to save to vault" });
    }
  });

  app.delete("/api/vault/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVaultItem(req.params.id);
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

  // Knowledge Base routes - require authentication for user-specific documents
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
      const doc = await storage.getKnowledgeBaseDoc(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      // Check ownership
      const userId = req.user?.id;
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

  // Pro Feature: Import Creator Style from Social Media
  app.post("/api/scrape/tiktok", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user has Pro or Ultimate plan
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "ultimate")) {
        return res.status(403).json({ 
          error: "This feature requires a Pro or Ultimate subscription",
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

  app.post("/api/scrape/instagram", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user has Pro or Ultimate plan
      const user = await storage.getUser(userId);
      if (!user || (user.plan !== "pro" && user.plan !== "ultimate")) {
        return res.status(403).json({ 
          error: "This feature requires a Pro or Ultimate subscription",
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

  return httpServer;
}
