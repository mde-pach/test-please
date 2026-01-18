import type { ParsedEndpoint, APIInfo, TestCollection, APITest, TestGroup } from '@/types';
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

  // Create groups for test organization
  const groups = createTestGroups(allTests);

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
    groups,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create test groups for hierarchical organization
 * Groups tests by endpoint and by category
 */
function createTestGroups(tests: APITest[]): TestGroup[] {
  const groups: TestGroup[] = [];
  const endpointMap = new Map<string, string[]>();
  const categoryMap = new Map<string, string[]>();

  // Group tests by endpoint and category
  tests.forEach(test => {
    const endpointPath = test.metadata?.endpointPath || test.request.url;
    const category = test.category;

    // Group by endpoint
    if (!endpointMap.has(endpointPath)) {
      endpointMap.set(endpointPath, []);
    }
    endpointMap.get(endpointPath)!.push(test.id);

    // Group by category
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(test.id);
  });

  // Create endpoint groups
  endpointMap.forEach((testIds, endpointPath) => {
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
  categoryMap.forEach((testIds, category) => {
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

  return groups;
}
