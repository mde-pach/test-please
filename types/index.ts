import type { OpenAPIV3 } from 'openapi-types';

export interface OpenAPIInput {
  source: 'url' | 'file';
  content: string;
}

export interface ParsedEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  tags?: string[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  schema: any;
  description?: string;
}

export interface RequestBody {
  required: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema?: any;
  example?: any;
  examples?: Record<string, any>;
}

export interface Response {
  description: string;
  content?: Record<string, MediaType>;
}

export interface APIInfo {
  title: string;
  version: string;
  baseUrl?: string;
  description?: string;
}

export interface ParseOpenAPIResponse {
  success: boolean;
  endpoints?: ParsedEndpoint[];
  apiInfo?: APIInfo;
  error?: string;
}

export interface GeneratedTestCase {
  testName: string;
  description: string;
  endpoint: string;
  method: string;
  testType: 'success' | 'error' | 'validation' | 'edge-case';
  setup?: string;
  requestData?: any;
  expectedStatus: number;
  assertions: string[];
}

export interface GeneratedTestFile {
  filename: string;
  content: string;
  endpoint: string;
  testCount: number;
}

export interface GenerateTestsRequest {
  endpoints: ParsedEndpoint[];
  apiInfo: APIInfo;
  options?: {
    includeEdgeCases?: boolean;
    maxTestsPerEndpoint?: number;
  };
}

export interface GenerateTestsResponse {
  success: boolean;
  testFiles?: GeneratedTestFile[];
  collection?: import('./test-format').TestCollection;
  error?: string;
}

// Re-export test format types
export * from './test-format';
