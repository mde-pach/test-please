import type { ParsedEndpoint, APIInfo, TestCollection, APITest } from '@/types';
import { generateStructuredTests } from './ai-test-generator';
import { v4 as uuidv4 } from 'uuid';

export async function generateTestCollection(
  endpoints: ParsedEndpoint[],
  apiInfo: APIInfo,
  options?: {
    includeEdgeCases?: boolean;
    maxTestsPerEndpoint?: number;
  }
): Promise<TestCollection> {
  const collectionId = uuidv4();
  const allTests: APITest[] = [];

  // Generate tests for each endpoint
  for (const endpoint of endpoints) {
    try {
      // Use AI to generate structured tests
      const tests = await generateStructuredTests(endpoint, apiInfo, collectionId);

      // Limit number of tests if specified
      const limitedTests = options?.maxTestsPerEndpoint
        ? tests.slice(0, options.maxTestsPerEndpoint)
        : tests;

      allTests.push(...limitedTests);
    } catch (error) {
      console.error(`Failed to generate tests for ${endpoint.method} ${endpoint.path}:`, error);
      // Continue with other endpoints even if one fails
    }
  }

  return {
    id: collectionId,
    name: `${apiInfo.title} API Tests`,
    description: apiInfo.description || `Test collection for ${apiInfo.title} v${apiInfo.version}`,
    apiInfo: {
      title: apiInfo.title,
      version: apiInfo.version,
      baseUrl: apiInfo.baseUrl || 'https://api.example.com',
    },
    tests: allTests,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
