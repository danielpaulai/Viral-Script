import {
  type User,
  type InsertUser,
  type Script,
  type InsertScript,
  type Project,
  type InsertProject,
  type VaultItem,
  type InsertVault,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scripts: Map<string, Script>;
  private projects: Map<string, Project>;
  private vault: Map<string, VaultItem>;
  private projectScripts: Map<string, string[]>;

  constructor() {
    this.users = new Map();
    this.scripts = new Map();
    this.projects = new Map();
    this.vault = new Map();
    this.projectScripts = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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
      ...insertScript,
      id,
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
      ...insertProject,
      id,
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
}

export const storage = new MemStorage();
