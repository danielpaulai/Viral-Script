import {
  type User,
  type InsertUser,
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
  users,
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPgSimple(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(userId: string, plan: string): Promise<User | undefined>;
  
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
    // Use memory session store for reliability across environments
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods use the database for persistence
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const result = await db.insert(users).values({
      id,
      username: insertUser.username,
      password: insertUser.password,
      plan: "starter",
      planExpiresAt: null,
    }).returning();
    return result[0];
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
    const result = await db.update(users)
      .set({ plan })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
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
}

export const storage = new MemStorage();
