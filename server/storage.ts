import {
  type User,
  type UpsertUser,
  type Script,
  type InsertScript,
  type Project,
  type InsertProject,
  type VaultItem,
  type InsertVault,
  type KnowledgeBaseDoc,
  type InsertKnowledgeBase,
  type CompetitorAsset,
  type InsertCompetitorAsset,
  type ContentStrategy,
  type InsertContentStrategy,
  type UserUsage,
  type InsertUserUsage,
  type UserSubscription,
  type InsertUserSubscription,
  type ScriptVersion,
  type InsertScriptVersion,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type ScriptTemplate,
  type InsertScriptTemplate,
  type CtaTemplate,
  type InsertCtaTemplate,
  users,
  passwordResetTokens,
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db, pool, isDatabaseAvailable } from "./db";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPgSimple(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserPlan(userId: string, plan: string): Promise<User | undefined>;
  incrementTrialScriptsUsed(userId: string): Promise<void>;
  checkTrialStatus(userId: string): Promise<{ isOnTrial: boolean; trialEnded: boolean; scriptsRemaining: number; daysRemaining: number }>;
  
  getScripts(): Promise<Script[]>;
  getScript(id: string): Promise<Script | undefined>;
  createScript(script: InsertScript): Promise<Script>;
  updateScript(id: string, script: Partial<InsertScript>): Promise<Script | undefined>;
  deleteScript(id: string): Promise<boolean>;
  
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  deleteProject(id: string): Promise<boolean>;
  addScriptToProject(projectId: string, scriptId: string): Promise<void>;
  getProjectScripts(projectId: string): Promise<string[]>;
  
  getVaultItems(): Promise<VaultItem[]>;
  getVaultItem(id: string): Promise<VaultItem | undefined>;
  createVaultItem(item: InsertVault): Promise<VaultItem>;
  deleteVaultItem(id: string): Promise<boolean>;
  
  getKnowledgeBaseDocs(userId?: string): Promise<KnowledgeBaseDoc[]>;
  getKnowledgeBaseDoc(id: string): Promise<KnowledgeBaseDoc | undefined>;
  createKnowledgeBaseDoc(doc: InsertKnowledgeBase): Promise<KnowledgeBaseDoc>;
  updateKnowledgeBaseDoc(id: string, doc: Partial<InsertKnowledgeBase>): Promise<KnowledgeBaseDoc | undefined>;
  deleteKnowledgeBaseDoc(id: string): Promise<boolean>;
  
  getCompetitorAssets(userId?: string): Promise<CompetitorAsset[]>;
  createCompetitorAsset(asset: InsertCompetitorAsset): Promise<CompetitorAsset>;
  deleteCompetitorAsset(id: string): Promise<boolean>;
  
  getContentStrategies(userId?: string): Promise<ContentStrategy[]>;
  createContentStrategy(strategy: InsertContentStrategy): Promise<ContentStrategy>;
  deleteContentStrategy(id: string): Promise<boolean>;
  
  getUserUsage(userId: string, month: string): Promise<UserUsage | undefined>;
  updateUserUsage(userId: string, month: string, updates: Partial<UserUsage>): Promise<UserUsage>;
  incrementUsage(userId: string, month: string, field: 'scriptsGenerated' | 'deepResearchUsed' | 'knowledgeBaseQueries'): Promise<void>;
  
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createOrUpdateSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  
  // Version History
  getScriptVersions(scriptId: string): Promise<ScriptVersion[]>;
  createScriptVersion(version: InsertScriptVersion): Promise<ScriptVersion>;
  getScriptVersion(id: string): Promise<ScriptVersion | undefined>;
  
  // Password Reset
  createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Script Templates
  getScriptTemplates(userId: string): Promise<ScriptTemplate[]>;
  getScriptTemplate(id: string): Promise<ScriptTemplate | undefined>;
  createScriptTemplate(template: InsertScriptTemplate): Promise<ScriptTemplate>;
  updateScriptTemplate(id: string, template: Partial<InsertScriptTemplate>): Promise<ScriptTemplate | undefined>;
  deleteScriptTemplate(id: string): Promise<boolean>;
  incrementTemplateUsage(id: string): Promise<void>;
  
  // CTA Templates
  getCtaTemplates(userId: string): Promise<CtaTemplate[]>;
  getCtaTemplate(id: string): Promise<CtaTemplate | undefined>;
  createCtaTemplate(template: InsertCtaTemplate): Promise<CtaTemplate>;
  deleteCtaTemplate(id: string): Promise<boolean>;
  incrementCtaTemplateUsage(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private scripts: Map<string, Script>;
  private projects: Map<string, Project>;
  private vault: Map<string, VaultItem>;
  private projectScripts: Map<string, string[]>;
  private knowledgeBase: Map<string, KnowledgeBaseDoc>;
  private competitorAssets: Map<string, CompetitorAsset>;
  private contentStrategies: Map<string, ContentStrategy>;
  private userUsage: Map<string, UserUsage>;
  private userSubscriptions: Map<string, UserSubscription>;
  private usersMemory: Map<string, User>;
  private scriptVersions: Map<string, ScriptVersion>;
  private scriptTemplates: Map<string, ScriptTemplate>;
  private ctaTemplates: Map<string, CtaTemplate>;
  sessionStore: session.Store;

  constructor() {
    this.scripts = new Map();
    this.projects = new Map();
    this.vault = new Map();
    this.projectScripts = new Map();
    this.knowledgeBase = new Map();
    this.competitorAssets = new Map();
    this.contentStrategies = new Map();
    this.userUsage = new Map();
    this.userSubscriptions = new Map();
    this.usersMemory = new Map();
    this.scriptVersions = new Map();
    this.scriptTemplates = new Map();
    this.ctaTemplates = new Map();
    
    // Use PostgreSQL session store in production for persistent sessions
    if (process.env.DATABASE_URL && pool) {
      console.log("Using PostgreSQL session store for persistent sessions");
      this.sessionStore = new PgSession({
        pool: pool,
        tableName: "sessions",
        createTableIfMissing: true,
        ttl: 7 * 24 * 60 * 60, // 7 days in seconds
      });
    } else {
      console.log("Using in-memory session store (sessions will be lost on restart)");
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // User methods with database fallback to memory
  async getUser(id: string): Promise<User | undefined> {
    // Try database first, fall back to memory
    if (db) {
      try {
        const result = await db.select().from(users).where(eq(users.id, id));
        if (result[0]) return result[0];
      } catch (e) {
        console.log("Database query failed, using memory:", (e as Error).message);
      }
    }
    return this.usersMemory.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Try database first, fall back to memory
    if (db) {
      try {
        const result = await db.select().from(users).where(eq(users.username, username));
        if (result[0]) return result[0];
      } catch (e) {
        console.log("Database query failed, using memory:", (e as Error).message);
      }
    }
    // Check memory storage
    const memUsers = Array.from(this.usersMemory.values());
    for (const user of memUsers) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    
    // Try database first
    if (db) {
      try {
        const result = await db.insert(users).values({
          id,
          username: insertUser.username,
          password: insertUser.password,
          plan: "starter",
          planExpiresAt: null,
        }).returning();
        if (result[0]) return result[0];
      } catch (e) {
        console.log("Database insert failed, using memory:", (e as Error).message);
      }
    }
    
    // Fall back to memory storage
    const user: User = {
      id,
      username: insertUser.username || null,
      password: insertUser.password || null,
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      plan: "starter",
      planExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.usersMemory.set(id, user);
    return user;
  }

  async getScripts(): Promise<Script[]> {
    return Array.from(this.scripts.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getScript(id: string): Promise<Script | undefined> {
    return this.scripts.get(id);
  }

  async createScript(insertScript: InsertScript): Promise<Script> {
    const id = randomUUID();
    const script: Script = {
      id,
      title: insertScript.title,
      script: insertScript.script,
      wordCount: insertScript.wordCount ?? null,
      gradeLevel: insertScript.gradeLevel ?? null,
      productionNotes: insertScript.productionNotes ?? null,
      bRollIdeas: insertScript.bRollIdeas ?? null,
      onScreenText: insertScript.onScreenText ?? null,
      parameters: insertScript.parameters ?? null,
      status: insertScript.status ?? null,
      createdAt: new Date(),
    };
    this.scripts.set(id, script);
    return script;
  }

  async updateScript(id: string, updates: Partial<InsertScript>): Promise<Script | undefined> {
    const script = this.scripts.get(id);
    if (!script) return undefined;
    const updated = { ...script, ...updates };
    this.scripts.set(id, updated);
    return updated;
  }

  async deleteScript(id: string): Promise<boolean> {
    return this.scripts.delete(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      id,
      name: insertProject.name,
      description: insertProject.description ?? null,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    this.projectScripts.delete(id);
    return this.projects.delete(id);
  }

  async addScriptToProject(projectId: string, scriptId: string): Promise<void> {
    const scripts = this.projectScripts.get(projectId) || [];
    if (!scripts.includes(scriptId)) {
      scripts.push(scriptId);
      this.projectScripts.set(projectId, scripts);
    }
  }

  async getProjectScripts(projectId: string): Promise<string[]> {
    return this.projectScripts.get(projectId) || [];
  }

  async getVaultItems(): Promise<VaultItem[]> {
    return Array.from(this.vault.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getVaultItem(id: string): Promise<VaultItem | undefined> {
    return this.vault.get(id);
  }

  async createVaultItem(insertItem: InsertVault): Promise<VaultItem> {
    const id = randomUUID();
    const item: VaultItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.vault.set(id, item);
    return item;
  }

  async deleteVaultItem(id: string): Promise<boolean> {
    return this.vault.delete(id);
  }

  async updateUserPlan(userId: string, plan: string): Promise<User | undefined> {
    // Try database first
    if (db) {
      try {
        const result = await db.update(users)
          .set({ plan })
          .where(eq(users.id, userId))
          .returning();
        if (result[0]) return result[0];
      } catch (e) {
        console.log("Database update failed, using memory:", (e as Error).message);
      }
    }
    // Fall back to memory
    const user = this.usersMemory.get(userId);
    if (user) {
      const updated = { ...user, plan, updatedAt: new Date() };
      this.usersMemory.set(userId, updated);
      return updated;
    }
    return undefined;
  }

  async incrementTrialScriptsUsed(userId: string): Promise<void> {
    if (db) {
      try {
        await db.update(users)
          .set({ 
            trialScriptsUsed: (await this.getUser(userId))?.trialScriptsUsed ? 
              ((await this.getUser(userId))?.trialScriptsUsed || 0) + 1 : 1
          })
          .where(eq(users.id, userId));
        return;
      } catch (e) {
        console.log("Database update failed:", (e as Error).message);
      }
    }
    // Memory fallback
    const user = this.usersMemory.get(userId);
    if (user) {
      user.trialScriptsUsed = (user.trialScriptsUsed || 0) + 1;
      this.usersMemory.set(userId, user);
    }
  }

  async checkTrialStatus(userId: string): Promise<{ isOnTrial: boolean; trialEnded: boolean; scriptsRemaining: number; daysRemaining: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { isOnTrial: false, trialEnded: true, scriptsRemaining: 0, daysRemaining: 0 };
    }

    // If user has a paid plan, they're not on trial
    if (user.plan && user.plan !== 'starter') {
      return { isOnTrial: false, trialEnded: false, scriptsRemaining: 999, daysRemaining: 999 };
    }

    const now = new Date();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const trialScriptsUsed = user.trialScriptsUsed || 0;
    const maxTrialScripts = 20;

    // If no trial end date, user hasn't started trial yet (legacy user)
    if (!trialEndsAt) {
      return { isOnTrial: true, trialEnded: false, scriptsRemaining: maxTrialScripts - trialScriptsUsed, daysRemaining: 7 };
    }

    const trialEnded = now > trialEndsAt;
    const scriptsRemaining = Math.max(0, maxTrialScripts - trialScriptsUsed);
    const daysRemaining = trialEnded ? 0 : Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isOnTrial: !trialEnded && scriptsRemaining > 0,
      trialEnded: trialEnded || scriptsRemaining === 0,
      scriptsRemaining,
      daysRemaining,
    };
  }

  async getKnowledgeBaseDocs(userId?: string): Promise<KnowledgeBaseDoc[]> {
    const docs = Array.from(this.knowledgeBase.values());
    if (userId) {
      return docs.filter(d => d.userId === userId).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return docs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getKnowledgeBaseDoc(id: string): Promise<KnowledgeBaseDoc | undefined> {
    return this.knowledgeBase.get(id);
  }

  async createKnowledgeBaseDoc(insertDoc: InsertKnowledgeBase): Promise<KnowledgeBaseDoc> {
    const id = randomUUID();
    const doc: KnowledgeBaseDoc = {
      id,
      userId: insertDoc.userId ?? null,
      type: insertDoc.type,
      title: insertDoc.title,
      content: insertDoc.content,
      summary: insertDoc.summary ?? null,
      tags: insertDoc.tags ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.knowledgeBase.set(id, doc);
    return doc;
  }

  async updateKnowledgeBaseDoc(id: string, updates: Partial<InsertKnowledgeBase>): Promise<KnowledgeBaseDoc | undefined> {
    const doc = this.knowledgeBase.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, ...updates, updatedAt: new Date() };
    this.knowledgeBase.set(id, updated);
    return updated;
  }

  async deleteKnowledgeBaseDoc(id: string): Promise<boolean> {
    return this.knowledgeBase.delete(id);
  }

  async getCompetitorAssets(userId?: string): Promise<CompetitorAsset[]> {
    const assets = Array.from(this.competitorAssets.values());
    if (userId) {
      return assets.filter(a => a.userId === userId).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return assets;
  }

  async createCompetitorAsset(insertAsset: InsertCompetitorAsset): Promise<CompetitorAsset> {
    const id = randomUUID();
    const asset: CompetitorAsset = {
      id,
      userId: insertAsset.userId ?? null,
      name: insertAsset.name,
      platform: insertAsset.platform ?? null,
      profileUrl: insertAsset.profileUrl ?? null,
      scripts: insertAsset.scripts ?? null,
      analysis: insertAsset.analysis ?? null,
      createdAt: new Date(),
    };
    this.competitorAssets.set(id, asset);
    return asset;
  }

  async deleteCompetitorAsset(id: string): Promise<boolean> {
    return this.competitorAssets.delete(id);
  }

  async getContentStrategies(userId?: string): Promise<ContentStrategy[]> {
    const strategies = Array.from(this.contentStrategies.values());
    if (userId) {
      return strategies.filter(s => s.userId === userId).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    return strategies;
  }

  async createContentStrategy(insertStrategy: InsertContentStrategy): Promise<ContentStrategy> {
    const id = randomUUID();
    const strategy: ContentStrategy = {
      id,
      userId: insertStrategy.userId ?? null,
      name: insertStrategy.name,
      category: insertStrategy.category,
      topics: insertStrategy.topics ?? null,
      hooks: insertStrategy.hooks ?? null,
      schedule: insertStrategy.schedule ?? null,
      createdAt: new Date(),
    };
    this.contentStrategies.set(id, strategy);
    return strategy;
  }

  async deleteContentStrategy(id: string): Promise<boolean> {
    return this.contentStrategies.delete(id);
  }

  async getUserUsage(userId: string, month: string): Promise<UserUsage | undefined> {
    const key = `${userId}_${month}`;
    return this.userUsage.get(key);
  }

  async updateUserUsage(userId: string, month: string, updates: Partial<UserUsage>): Promise<UserUsage> {
    const key = `${userId}_${month}`;
    const existing = this.userUsage.get(key);
    const usage: UserUsage = existing ? {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    } : {
      id: randomUUID(),
      userId,
      month,
      scriptsGenerated: updates.scriptsGenerated || "0",
      deepResearchUsed: updates.deepResearchUsed || "0",
      knowledgeBaseQueries: updates.knowledgeBaseQueries || "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userUsage.set(key, usage);
    return usage;
  }

  async incrementUsage(userId: string, month: string, field: 'scriptsGenerated' | 'deepResearchUsed' | 'knowledgeBaseQueries'): Promise<void> {
    const key = `${userId}_${month}`;
    const existing = this.userUsage.get(key);
    if (existing) {
      const currentValue = parseInt(existing[field] || "0", 10);
      (existing as any)[field] = String(currentValue + 1);
      existing.updatedAt = new Date();
      this.userUsage.set(key, existing);
    } else {
      const usage: UserUsage = {
        id: randomUUID(),
        userId,
        month,
        scriptsGenerated: field === 'scriptsGenerated' ? "1" : "0",
        deepResearchUsed: field === 'deepResearchUsed' ? "1" : "0",
        knowledgeBaseQueries: field === 'knowledgeBaseQueries' ? "1" : "0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userUsage.set(key, usage);
    }
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    return this.userSubscriptions.get(userId);
  }

  async createOrUpdateSubscription(userId: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const existing = this.userSubscriptions.get(userId);
    const subscription: UserSubscription = existing ? {
      ...existing,
      ...data,
      updatedAt: new Date(),
    } : {
      id: randomUUID(),
      userId,
      plan: data.plan || "starter",
      status: data.status || "active",
      billingCycle: data.billingCycle || "monthly",
      currentPeriodStart: data.currentPeriodStart || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || "false",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userSubscriptions.set(userId, subscription);
    return subscription;
  }

  // Version History methods
  async getScriptVersions(scriptId: string): Promise<ScriptVersion[]> {
    const versions: ScriptVersion[] = [];
    this.scriptVersions.forEach((v) => {
      if (v.scriptId === scriptId) versions.push(v);
    });
    return versions.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createScriptVersion(version: InsertScriptVersion): Promise<ScriptVersion> {
    const existingVersions = await this.getScriptVersions(version.scriptId);
    const newVersion: ScriptVersion = {
      id: randomUUID(),
      scriptId: version.scriptId,
      userId: version.userId || null,
      version: String(existingVersions.length + 1),
      label: version.label || null,
      script: version.script,
      wordCount: version.wordCount || null,
      gradeLevel: version.gradeLevel || null,
      parameters: version.parameters || null,
      createdAt: new Date(),
    };
    this.scriptVersions.set(newVersion.id, newVersion);
    return newVersion;
  }

  async getScriptVersion(id: string): Promise<ScriptVersion | undefined> {
    return this.scriptVersions.get(id);
  }

  // Password Reset Token methods
  async createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const id = randomUUID();
    const now = new Date();
    
    // Use database
    if (db) {
      try {
        const result = await db.insert(passwordResetTokens).values({
          id,
          userId: data.userId,
          token: data.token,
          expiresAt: data.expiresAt,
          createdAt: now,
        }).returning();
        if (result[0]) return result[0];
      } catch (e) {
        console.error("Failed to create password reset token:", (e as Error).message);
        throw e;
      }
    }
    
    throw new Error("Database not available for password reset");
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    if (db) {
      try {
        const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
        return result[0];
      } catch (e) {
        console.error("Failed to get password reset token:", (e as Error).message);
      }
    }
    return undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    if (db) {
      try {
        await db.update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(eq(passwordResetTokens.token, token));
      } catch (e) {
        console.error("Failed to mark token as used:", (e as Error).message);
      }
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    if (db) {
      try {
        await db.update(users)
          .set({ password: hashedPassword, updatedAt: new Date() })
          .where(eq(users.id, userId));
      } catch (e) {
        console.error("Failed to update user password:", (e as Error).message);
        throw e;
      }
    } else {
      // Update in memory
      const user = this.usersMemory.get(userId);
      if (user) {
        user.password = hashedPassword;
        user.updatedAt = new Date();
        this.usersMemory.set(userId, user);
      }
    }
  }

  // Script Template methods
  async getScriptTemplates(userId: string): Promise<ScriptTemplate[]> {
    const templates = Array.from(this.scriptTemplates.values())
      .filter(t => t.userId === userId || t.isPublic === "true")
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    return templates;
  }

  async getScriptTemplate(id: string): Promise<ScriptTemplate | undefined> {
    return this.scriptTemplates.get(id);
  }

  async createScriptTemplate(template: InsertScriptTemplate): Promise<ScriptTemplate> {
    const id = randomUUID();
    const now = new Date();
    const newTemplate: ScriptTemplate = {
      id,
      userId: template.userId,
      name: template.name,
      description: template.description || null,
      platform: template.platform || "tiktok",
      duration: template.duration || "90",
      category: template.category || "content_creation",
      structure: template.structure || "problem_solver",
      hook: template.hook || "painful_past",
      tone: template.tone || null,
      voice: template.voice || null,
      pacing: template.pacing || null,
      videoType: template.videoType || "talking_head",
      creatorStyle: template.creatorStyle || "default",
      defaultTargetAudience: template.defaultTargetAudience || null,
      defaultCta: template.defaultCta || null,
      isPublic: template.isPublic || "false",
      usageCount: "0",
      createdAt: now,
      updatedAt: now,
    };
    this.scriptTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateScriptTemplate(id: string, updates: Partial<InsertScriptTemplate>): Promise<ScriptTemplate | undefined> {
    const template = this.scriptTemplates.get(id);
    if (!template) return undefined;
    
    const updated: ScriptTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };
    this.scriptTemplates.set(id, updated);
    return updated;
  }

  async deleteScriptTemplate(id: string): Promise<boolean> {
    return this.scriptTemplates.delete(id);
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const template = this.scriptTemplates.get(id);
    if (template) {
      template.usageCount = String(parseInt(template.usageCount || "0") + 1);
      this.scriptTemplates.set(id, template);
    }
  }

  // CTA Template methods
  async getCtaTemplates(userId: string): Promise<CtaTemplate[]> {
    const templates = Array.from(this.ctaTemplates.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    return templates;
  }

  async getCtaTemplate(id: string): Promise<CtaTemplate | undefined> {
    return this.ctaTemplates.get(id);
  }

  async createCtaTemplate(template: InsertCtaTemplate): Promise<CtaTemplate> {
    const id = randomUUID();
    const now = new Date();
    const newTemplate: CtaTemplate = {
      id,
      userId: template.userId,
      title: template.title,
      content: template.content,
      category: template.category || "general",
      sourceContext: template.sourceContext || null,
      usageCount: "0",
      createdAt: now,
    };
    this.ctaTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async deleteCtaTemplate(id: string): Promise<boolean> {
    return this.ctaTemplates.delete(id);
  }

  async incrementCtaTemplateUsage(id: string): Promise<void> {
    const template = this.ctaTemplates.get(id);
    if (template) {
      template.usageCount = String(parseInt(template.usageCount || "0") + 1);
      this.ctaTemplates.set(id, template);
    }
  }
}

export const storage = new MemStorage();
