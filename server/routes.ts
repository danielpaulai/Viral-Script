import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import {
  scriptCategories,
  hookFormats,
  structureFormats,
  toneOptions,
  voiceOptions,
  pacingOptions,
  durationOptions,
  type ScriptParameters,
  type GeneratedScript,
} from "@shared/schema";

function generateScript(params: ScriptParameters): GeneratedScript {
  const category = scriptCategories.find((c) => c.id === params.category);
  const hook = hookFormats.find((h) => h.id === params.hook);
  const structure = structureFormats.find((s) => s.id === params.structure);
  const duration = durationOptions.find((d) => d.id === params.duration);

  const hookLine = hook?.example || "Here's something you need to know.";
  
  const sampleScripts: Record<string, string> = {
    problem_solver: `${hookLine}

Most people struggle with this every single day.

They try everything but nothing works.

Here's the real problem.

They're approaching it all wrong.

Let me show you what actually works.

${params.topic ? `When it comes to ${params.topic.toLowerCase()}, the solution is simpler than you think.` : "The solution is simpler than you think."}

First, understand the core issue.

Then, take action on what matters.

Stop overcomplicating things.

${params.callToAction || "Follow for more tips like this."}`,

    breakdown: `${hookLine}

Let me break this down for you.

There are three key parts to understand.

Number one: The foundation.

${params.topic ? `When working with ${params.topic.toLowerCase()}, you need to start here.` : "You need to start with the basics."}

Number two: The execution.

This is where most people fail.

Number three: The results.

Put these together and everything changes.

${params.callToAction || "Save this for later."}`,

    listicle: `${hookLine}

Here are 3 things that will change everything.

Number one.

${params.topic ? `Focus on ${params.topic.toLowerCase()} first.` : "Focus on what matters most."}

This is non-negotiable.

Number two.

Stay consistent even when it's hard.

Results come from repetition.

Number three.

Track your progress weekly.

What gets measured gets improved.

${params.callToAction || "Comment which one you're trying first."}`,

    tutorial: `${hookLine}

Let me walk you through this step by step.

Step one: Get started.

${params.topic ? `Open up your ${params.topic.toLowerCase()} and look at this.` : "Pull this up on your screen."}

Step two: Make the change.

Click here, then here.

Step three: See the results.

That's it. You're done.

Took less than 2 minutes.

${params.callToAction || "Try this and let me know how it goes."}`,

    story_arc: `${hookLine}

A year ago, I was stuck.

Nothing was working.

I tried everything.

Then something changed.

${params.topic ? `I discovered a different approach to ${params.topic.toLowerCase()}.` : "I found a completely different approach."}

It wasn't easy at first.

But I kept going.

Now? Everything is different.

Here's what I learned.

The struggle was necessary.

It taught me what really matters.

${params.callToAction || "If you're going through this, keep going."}`,

    educational_motivation: `${hookLine}

I used to think I knew everything.

Then life humbled me.

${params.topic ? `${params.topic} taught me something unexpected.` : "This experience taught me something unexpected."}

The lesson wasn't what I expected.

It was simpler.

More powerful.

Here's what changed my perspective.

Stop chasing perfection.

Start embracing progress.

You're already on the right path.

${params.callToAction || "Remember this when things get hard."}`,
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
