import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import {
  scriptCategories,
  viralHooks,
  structureFormats,
  toneOptions,
  voiceOptions,
  pacingOptions,
  durationOptions,
  type ScriptParameters,
  type GeneratedScript,
} from "@shared/schema";

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
    `0:02 "${hookLine.slice(0, 30)}..." → Dramatic reveal shot`,
    `0:10 "Here's what..." → Screen recording or example`,
    `0:25 Key point → Visual demonstration`,
    `0:40 Result → Before/after comparison`,
  ];

  const onScreenText = [
    hook?.name || "Hook",
    params.topic?.slice(0, 20) || "Key Point",
    params.callToAction?.slice(0, 15) || "CTA",
  ];

  return {
    id: randomUUID(),
    script: scriptContent,
    wordCount,
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    productionNotes,
    bRollIdeas,
    onScreenText,
    parameters: params,
    createdAt: new Date(),
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/scripts/generate", async (req, res) => {
    try {
      const params: ScriptParameters = req.body;
      const generatedScript = generateScript(params);
      
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
    res.json(hookFormats);
  });

  app.get("/api/categories", (req, res) => {
    res.json(scriptCategories);
  });

  app.get("/api/structures", (req, res) => {
    res.json(structureFormats);
  });

  return httpServer;
}
