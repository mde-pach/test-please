import type { ParsedEndpoint, APIInfo, GeneratedTestFile } from '@/types';
import { generateTestCasesForEndpoint } from './ai-client';
import { generateVitestFile, generateFilename } from './templates/vitest-template';

export async function generateTestFiles(
  endpoints: ParsedEndpoint[],
  apiInfo: APIInfo,
  options?: {
    includeEdgeCases?: boolean;
    maxTestsPerEndpoint?: number;
  }
): Promise<GeneratedTestFile[]> {
  const testFiles: GeneratedTestFile[] = [];

  // Generate tests for each endpoint
  for (const endpoint of endpoints) {
    try {
      // Use AI to generate test cases
      const testCases = await generateTestCasesForEndpoint(endpoint, apiInfo);

      // Limit number of tests if specified
      const limitedTestCases = options?.maxTestsPerEndpoint
        ? testCases.slice(0, options.maxTestsPerEndpoint)
        : testCases;

      // Generate the Vitest test file
      const fileContent = generateVitestFile(
        endpoint,
        limitedTestCases,
        apiInfo.baseUrl || 'https://api.example.com'
      );

      const filename = generateFilename(endpoint);

      testFiles.push({
        filename,
        content: fileContent,
        endpoint: `${endpoint.method} ${endpoint.path}`,
        testCount: limitedTestCases.length,
      });
    } catch (error) {
      console.error(`Failed to generate tests for ${endpoint.method} ${endpoint.path}:`, error);
      // Continue with other endpoints even if one fails
    }
  }

  return testFiles;
}
