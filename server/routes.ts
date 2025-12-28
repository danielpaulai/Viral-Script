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
  type ScriptParameters,
  type GeneratedScript,
  type KnowledgeBaseDoc,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Words that sound like AI - avoid these
const aiWordsToAvoid = [
  "utilize", "leverage", "unlock", "dive into", "delve", "explore", "crucial",
  "comprehensive", "robust", "streamline", "revolutionize", "elevate", "harness",
  "optimize", "empower", "game-changing", "cutting-edge", "seamless", "actionable",
  "innovative", "paradigm", "synergy", "holistic", "groundbreaking", "transform"
];

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

  const knowledgeBaseInstructions = kbContext ? `
IMPORTANT - USE THE KNOWLEDGE BASE:
You have access to the creator's brand knowledge base below. Use this to:
- Match their exact voice, tone, and speaking style
- Reference their ICP's pain points, fears, and desires
- Use their brand messaging pillars and UVP
- Incorporate their specific terminology and phrases
- Align with their content strategy and positioning
- Make the script sound authentically like THEM, not generic

=== KNOWLEDGE BASE START ===
${kbContext}
=== KNOWLEDGE BASE END ===

` : "";

  const systemPrompt = `You are a world-class short-form video scriptwriter. Write scripts that:
- Use punchy, conversational language (grade 4-6 reading level)
- One short sentence or phrase per line
- Never use AI buzzwords: ${aiWordsToAvoid.slice(0, 10).join(", ")}
- Include specific numbers, examples, and data when available
- Create tension, curiosity, or emotional connection
- Use pattern interrupts to maintain attention
- End with a compelling call to action

Structure each script as:
HOOK (first 3 seconds - must stop the scroll)
SETUP (context and problem)
CONTENT (the meat - specific insights, steps, or revelations)
CTA (call to action)

Separate each line with a blank line for clarity.`;

  const userPrompt = `Write a ${params.duration}-second video script (aim for ${targetWords.min}-${targetWords.max} words).

${knowledgeBaseInstructions}
TOPIC: ${params.topic}
HOOK STYLE: ${hook?.name || "The Painful Past"} - "${hook?.template || "I used to [painful thing everyone relates to]."}"
STRUCTURE: ${structure?.name || "Problem Solver"} - ${structure?.description || "Present problem, then solution"}
TONE: ${tone?.name || "High Energy"}
VOICE: ${voice?.name || "Confident"}
PLATFORM: ${params.platform}
${params.contentStrategy ? `CONTENT CATEGORY: ${params.contentStrategy} (consider this funnel stage when writing)` : ""}
${params.targetAudience ? `TARGET AUDIENCE: ${params.targetAudience}` : ""}
${params.keyFacts ? `KEY FACTS TO INCLUDE: ${params.keyFacts}` : ""}
CTA TO END WITH: ${finalCta}

${researchContext ? `RESEARCH FINDINGS TO INCORPORATE:
${researchContext}

Use these research findings to make your script more specific, credible, and valuable. Include real data, examples, and insights.` : ""}

Write the script now. Make it punchy, specific, and impossible to scroll past. Each line should be its own paragraph.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const scriptContent = response.choices[0]?.message?.content || "";
    
    const words = scriptContent.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const avgWordsPerSentence = words.length / Math.max(1, scriptContent.split(/[.!?]+/).length - 1);
    const gradeLevel = Math.max(3, Math.min(12, 0.39 * avgWordsPerSentence + 4));

    const productionNotes = `Film close-up, direct to camera. High energy on the hook. ${researchContext ? "Script includes researched data - emphasize stats with text overlays." : ""} Natural pauses between key points. ${params.platform === "tiktok" ? "Keep cuts fast and dynamic." : "Match the pace to your audience."}`;

    const bRollIdeas = [
      `Screen recording demonstrating ${params.topic?.split(" ").slice(0, 3).join(" ") || "concept"}`,
      `Before/after comparison graphics with stats`,
      `Text animations for key data points`,
      `Close-up hands or demonstrating actions`,
      `Reaction shots or nodding moments`,
    ];

    const onScreenText = [
      scriptContent.split("\n")[0]?.slice(0, 50) || "Hook text...",
      `Key stat or insight`,
      finalCta.slice(0, 30),
    ];

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

  return httpServer;
}
