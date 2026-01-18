// Standard test format - similar to Bruno's .bru format but as JSON

export interface APITest {
  id: string;
  name: string;
  description?: string;
  collectionId: string;
  category: 'contract' | 'story'; // NEW: Test categorization
  request: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    pathParams?: Record<string, string>;
    body?: {
      type: 'json' | 'form' | 'text' | 'none';
      data: any;
    };
    variableSubstitution?: {
      url?: string[]; // Variable names to substitute
      headers?: Record<string, string>;
      body?: Record<string, string>;
    };
  };
  assertions: Assertion[];
  testType: 'success' | 'error' | 'validation' | 'edge-case';
  steps?: TestStep[]; // NEW: Only for story tests (multi-step flows)
  metadata?: {
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    endpointPath?: string; // NEW: For grouping by endpoint
  };
}

export interface Assertion {
  type: 'status' | 'header' | 'body' | 'jsonPath' | 'responseTime' | 'schema';
  field?: string; // For header, jsonPath assertions
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists' | 'matches';
  value?: any;
  description: string;
}

export interface TestCollection {
  id: string;
  name: string;
  description?: string;
  apiInfo: {
    title: string;
    version: string;
    baseUrl: string;
  };
  tests: APITest[];
  projectId?: string; // NEW: Link to parent project
  groups: TestGroup[]; // NEW: Hierarchical test organization
  createdAt: string;
  updatedAt: string;
}

export interface TestExecution {
  testId: string;
  executedAt: string;
  status: 'passed' | 'failed' | 'error';
  duration: number; // milliseconds
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
  };
  assertionResults: AssertionResult[];
  error?: string;
}

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  message: string;
  actual?: any;
  expected?: any;
}

export interface TestExecutionRequest {
  test: APITest;
}

export interface TestExecutionResponse {
  success: boolean;
  execution?: TestExecution;
  error?: string;
}

// For batch execution
export interface CollectionExecutionRequest {
  collectionId: string;
  tests: APITest[];
}

export interface CollectionExecutionResponse {
  success: boolean;
  executions: TestExecution[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    duration: number;
  };
  error?: string;
}

// New interfaces for multi-step story tests and test organization

export interface TestStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  request: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    pathParams?: Record<string, string>;
    body?: {
      type: 'json' | 'form' | 'text' | 'none';
      data: any;
    };
  };
  assertions: Assertion[];
  extractVariables?: VariableExtraction[];
  dependencies?: string[]; // Step IDs this depends on
}

export interface VariableExtraction {
  name: string; // e.g., "userId", "authToken"
  source: 'header' | 'body' | 'jsonPath';
  path?: string; // For jsonPath (e.g., "$.data.id")
  headerName?: string;
}

export interface TestGroup {
  id: string;
  name: string;
  type: 'endpoint' | 'category' | 'custom';
  metadata: {
    endpointPath?: string;
    category?: 'contract' | 'story';
    customTags?: string[];
  };
  testIds: string[];
  parentGroupId?: string; // For nested groups
}

// Export APIInfo type for use in other modules
export interface APIInfo {
  title: string;
  version: string;
  description?: string;
  baseUrl?: string;
}
