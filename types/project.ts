import type { APIInfo, TestCollection, TestExecution } from './test-format';

export interface Project {
  id: string;
  name: string;
  description?: string;
  apiInfo: APIInfo;
  spec: {
    source: 'url' | 'file';
    content: string; // Original OpenAPI spec
    parsedAt: string;
  };
  collections: TestCollection[]; // NESTED (denormalized)
  executionHistory: ProjectExecutionHistory[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tags?: string[];
    favorite?: boolean;
  };
}

export interface ProjectExecutionHistory {
  id: string;
  executedAt: string;
  collectionId: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    duration: number;
  };
  executions: TestExecution[]; // Full details stored inline
}
