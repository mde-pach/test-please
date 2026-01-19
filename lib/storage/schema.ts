import type { Project } from '@/types/project';

/**
 * localStorage Schema Definition
 *
 * This defines the denormalized structure optimized for localStorage.
 * Projects contain fully nested collections and tests for fast reads.
 */
export interface LocalStorageSchema {
  'openapi-test-platform': {
    version: string;
    projects: {
      [projectId: string]: Project; // Denormalized - full project with nested data
    };
    settings: {
      theme?: 'light' | 'dark';
      defaultBaseUrl?: string;
    };
    meta: {
      lastOpenedProjectId?: string;
      projectOrder: string[]; // For custom project ordering
    };
  };
}

/**
 * Storage keys constants
 */
export const STORAGE_KEYS = {
  ROOT: 'openapi-test-platform',
  VERSION: '1.0.0',
} as const;

/**
 * Storage limits and warnings
 */
export const STORAGE_LIMITS = {
  MAX_SIZE_MB: 5, // localStorage typical limit is 5-10MB
  WARNING_THRESHOLD: 0.8, // Show warning at 80% capacity
} as const;
