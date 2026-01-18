import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types/project';
import type { TestCollection, APITest, TestGroup } from '@/types/test-format';
import { getStorageService } from './storage-service';

/**
 * Migration Service
 * Handles migration from sessionStorage to localStorage projects
 */

interface SessionStorageData {
  collection?: TestCollection;
  testFiles?: any[];
  apiInfo?: {
    title: string;
    version: string;
    description?: string;
    baseUrl?: string;
  };
}

export class MigrationService {
  /**
   * Check if there's data in sessionStorage that needs migration
   */
  static hasSessionStorageData(): boolean {
    if (typeof window === 'undefined') return false;

    const stored = sessionStorage.getItem('testResults');
    return !!stored;
  }

  /**
   * Get sessionStorage data for preview
   */
  static getSessionStorageData(): SessionStorageData | null {
    if (typeof window === 'undefined') return null;

    const stored = sessionStorage.getItem('testResults');
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse sessionStorage data:', error);
      return null;
    }
  }

  /**
   * Migrate sessionStorage data to a new project
   */
  static async migrateSessionStorageToProject(): Promise<Project | null> {
    const data = this.getSessionStorageData();
    if (!data || !data.collection || !data.apiInfo) {
      return null;
    }

    try {
      // Enhance collection with groups if not present
      const enhancedCollection = this.enhanceCollectionWithGroups(data.collection);

      // Enhance tests with category and endpointPath if not present
      const enhancedTests = enhancedCollection.tests.map(test => this.enhanceTest(test));

      // Create project
      const storage = getStorageService();
      const project = await storage.createProject({
        name: data.apiInfo.title,
        description: data.apiInfo.description || `Imported from ${data.apiInfo.title}`,
        apiInfo: {
          title: data.apiInfo.title,
          version: data.apiInfo.version,
          description: data.apiInfo.description,
          baseUrl: data.apiInfo.baseUrl || '',
        },
        spec: {
          source: 'file',
          content: '', // Original spec not stored in sessionStorage
          parsedAt: new Date().toISOString(),
        },
        collections: [
          {
            ...enhancedCollection,
            tests: enhancedTests,
          },
        ],
        executionHistory: [],
      });

      // Clear sessionStorage after successful migration
      sessionStorage.removeItem('testResults');

      return project;
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Failed to migrate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance collection with groups if not present
   */
  private static enhanceCollectionWithGroups(collection: TestCollection): TestCollection {
    if (collection.groups && collection.groups.length > 0) {
      return collection;
    }

    // Create groups by endpoint and category
    const groups: TestGroup[] = [];
    const endpointGroups = new Map<string, string[]>();
    const categoryGroups = new Map<string, string[]>();

    collection.tests.forEach(test => {
      const endpointPath = test.metadata?.endpointPath || test.request.url;
      const category = (test as any).category || 'contract';

      // Group by endpoint
      if (!endpointGroups.has(endpointPath)) {
        endpointGroups.set(endpointPath, []);
      }
      endpointGroups.get(endpointPath)!.push(test.id);

      // Group by category
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(test.id);
    });

    // Create endpoint groups
    endpointGroups.forEach((testIds, endpointPath) => {
      groups.push({
        id: uuidv4(),
        name: endpointPath,
        type: 'endpoint',
        metadata: {
          endpointPath,
        },
        testIds,
      });
    });

    // Create category groups
    categoryGroups.forEach((testIds, category) => {
      groups.push({
        id: uuidv4(),
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Tests`,
        type: 'category',
        metadata: {
          category: category as 'contract' | 'story',
        },
        testIds,
      });
    });

    return {
      ...collection,
      groups,
    };
  }

  /**
   * Enhance test with category and endpointPath if not present
   */
  private static enhanceTest(test: APITest): APITest {
    const enhanced = { ...test };

    // Add category if not present (default to contract)
    if (!(enhanced as any).category) {
      (enhanced as any).category = 'contract';
    }

    // Add endpointPath to metadata if not present
    if (!enhanced.metadata?.endpointPath) {
      enhanced.metadata = {
        ...enhanced.metadata,
        endpointPath: enhanced.request.url,
        createdAt: enhanced.metadata?.createdAt || new Date().toISOString(),
        updatedAt: enhanced.metadata?.updatedAt || new Date().toISOString(),
      };
    }

    return enhanced;
  }

  /**
   * Clear sessionStorage data without migrating
   */
  static clearSessionStorage(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('testResults');
  }
}
