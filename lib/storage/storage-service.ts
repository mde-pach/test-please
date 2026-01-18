import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectExecutionHistory } from '@/types/project';
import type { TestCollection } from '@/types/test-format';
import { STORAGE_KEYS, STORAGE_LIMITS, type LocalStorageSchema } from './schema';

/**
 * Storage Service Interface
 * Abstraction layer for easy migration to database later
 */
export interface IStorageService {
  // Project CRUD
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Collection management
  addCollection(projectId: string, collection: TestCollection): Promise<Project>;
  updateCollection(projectId: string, collectionId: string, updates: Partial<TestCollection>): Promise<Project>;

  // Execution history
  addExecutionHistory(projectId: string, history: ProjectExecutionHistory): Promise<Project>;

  // Import/Export
  exportProject(id: string): Promise<string>;
  importProject(data: string): Promise<Project>;

  // Storage management
  getStorageUsage(): Promise<{ used: number; max: number; percentage: number }>;
  clearAllData(): Promise<void>;
}

/**
 * localStorage Implementation
 * Denormalized structure optimized for client-side storage
 */
export class LocalStorageService implements IStorageService {
  private getStorageData(): LocalStorageSchema['openapi-test-platform'] {
    if (typeof window === 'undefined') {
      return this.getDefaultStorageData();
    }

    const stored = localStorage.getItem(STORAGE_KEYS.ROOT);
    if (!stored) {
      return this.getDefaultStorageData();
    }

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse localStorage data:', error);
      return this.getDefaultStorageData();
    }
  }

  private getDefaultStorageData(): LocalStorageSchema['openapi-test-platform'] {
    return {
      version: STORAGE_KEYS.VERSION,
      projects: {},
      settings: {},
      meta: {
        projectOrder: [],
      },
    };
  }

  private setStorageData(data: LocalStorageSchema['openapi-test-platform']): void {
    if (typeof window === 'undefined') {
      throw new Error('localStorage not available in server context');
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ROOT, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
      throw new Error('Storage quota exceeded. Please delete old projects or export and remove them.');
    }
  }

  async getProjects(): Promise<Project[]> {
    const data = this.getStorageData();
    const projects = Object.values(data.projects);

    // Sort by project order if defined, otherwise by updatedAt
    const projectOrder = data.meta.projectOrder || [];
    return projects.sort((a, b) => {
      const aIndex = projectOrder.indexOf(a.id);
      const bIndex = projectOrder.indexOf(b.id);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  async getProject(id: string): Promise<Project | null> {
    const data = this.getStorageData();
    return data.projects[id] || null;
  }

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      ...projectData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    const data = this.getStorageData();
    data.projects[project.id] = project;
    data.meta.projectOrder = [...(data.meta.projectOrder || []), project.id];
    this.setStorageData(data);

    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const data = this.getStorageData();
    const existingProject = data.projects[id];

    if (!existingProject) {
      throw new Error(`Project not found: ${id}`);
    }

    const updatedProject: Project = {
      ...existingProject,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    data.projects[id] = updatedProject;
    this.setStorageData(data);

    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    const data = this.getStorageData();

    if (!data.projects[id]) {
      throw new Error(`Project not found: ${id}`);
    }

    delete data.projects[id];
    data.meta.projectOrder = (data.meta.projectOrder || []).filter(pid => pid !== id);

    if (data.meta.lastOpenedProjectId === id) {
      delete data.meta.lastOpenedProjectId;
    }

    this.setStorageData(data);
  }

  async addCollection(projectId: string, collection: TestCollection): Promise<Project> {
    const data = this.getStorageData();
    const project = data.projects[projectId];

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Link collection to project
    const linkedCollection: TestCollection = {
      ...collection,
      projectId,
    };

    project.collections = [...project.collections, linkedCollection];
    project.updatedAt = new Date().toISOString();

    data.projects[projectId] = project;
    this.setStorageData(data);

    return project;
  }

  async updateCollection(
    projectId: string,
    collectionId: string,
    updates: Partial<TestCollection>
  ): Promise<Project> {
    const data = this.getStorageData();
    const project = data.projects[projectId];

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const collectionIndex = project.collections.findIndex(c => c.id === collectionId);
    if (collectionIndex === -1) {
      throw new Error(`Collection not found: ${collectionId}`);
    }

    project.collections[collectionIndex] = {
      ...project.collections[collectionIndex],
      ...updates,
      id: collectionId, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    project.updatedAt = new Date().toISOString();
    data.projects[projectId] = project;
    this.setStorageData(data);

    return project;
  }

  async addExecutionHistory(projectId: string, history: ProjectExecutionHistory): Promise<Project> {
    const data = this.getStorageData();
    const project = data.projects[projectId];

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    project.executionHistory = [...project.executionHistory, history];
    project.updatedAt = new Date().toISOString();

    // Keep only last 50 executions to prevent unbounded growth
    if (project.executionHistory.length > 50) {
      project.executionHistory = project.executionHistory.slice(-50);
    }

    data.projects[projectId] = project;
    this.setStorageData(data);

    return project;
  }

  async exportProject(id: string): Promise<string> {
    const project = await this.getProject(id);

    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    return JSON.stringify(project, null, 2);
  }

  async importProject(data: string): Promise<Project> {
    try {
      const importedProject = JSON.parse(data) as Project;

      // Validate basic structure
      if (!importedProject.apiInfo || !importedProject.spec) {
        throw new Error('Invalid project data: missing required fields');
      }

      // Generate new ID to avoid conflicts
      const now = new Date().toISOString();
      const project: Project = {
        ...importedProject,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        // Regenerate collection IDs to avoid conflicts
        collections: importedProject.collections.map(collection => ({
          ...collection,
          id: uuidv4(),
          projectId: '', // Will be set by createProject
        })),
      };

      return this.createProject(project);
    } catch (error) {
      console.error('Failed to import project:', error);
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  async getStorageUsage(): Promise<{ used: number; max: number; percentage: number }> {
    if (typeof window === 'undefined') {
      return { used: 0, max: STORAGE_LIMITS.MAX_SIZE_MB * 1024 * 1024, percentage: 0 };
    }

    const data = this.getStorageData();
    const dataString = JSON.stringify(data);
    const used = new Blob([dataString]).size;
    const max = STORAGE_LIMITS.MAX_SIZE_MB * 1024 * 1024; // Convert MB to bytes

    return {
      used,
      max,
      percentage: (used / max) * 100,
    };
  }

  async clearAllData(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('localStorage not available in server context');
    }

    localStorage.removeItem(STORAGE_KEYS.ROOT);
  }
}

/**
 * Get storage service instance (singleton pattern)
 */
let storageServiceInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new LocalStorageService();
  }
  return storageServiceInstance;
}
