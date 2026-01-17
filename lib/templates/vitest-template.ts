import type { GeneratedTestCase, ParsedEndpoint } from '@/types';

export function generateVitestFile(
  endpoint: ParsedEndpoint,
  testCases: GeneratedTestCase[],
  baseUrl: string = 'https://api.example.com'
): string {
  const imports = generateImports();
  const baseUrlConstant = generateBaseUrlConstant(baseUrl);
  const describeBlock = generateDescribeBlock(endpoint, testCases);

  return `${imports}\n\n${baseUrlConstant}\n\n${describeBlock}`;
}

function generateImports(): string {
  return `import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';`;
}

function generateBaseUrlConstant(baseUrl: string): string {
  return `const BASE_URL = '${baseUrl}';`;
}

function generateDescribeBlock(endpoint: ParsedEndpoint, testCases: GeneratedTestCase[]): string {
  const testCasesCode = testCases.map(tc => generateTestCase(tc, endpoint)).join('\n\n');

  return `describe('${endpoint.method} ${endpoint.path}${endpoint.summary ? ' - ' + endpoint.summary : ''}', () => {
${testCasesCode}
});`;
}

function generateTestCase(testCase: GeneratedTestCase, endpoint: ParsedEndpoint): string {
  const { testName, description, requestData, expectedStatus, assertions, testType } = testCase;

  // Build the request code
  const requestCode = generateRequestCode(endpoint, requestData);

  // Build the assertions
  const assertionsCode = generateAssertions(assertions, expectedStatus, testType);

  return `  it('${testName}', async () => {
    // ${description}
${requestCode}
${assertionsCode}
  });`;
}

function generateRequestCode(endpoint: ParsedEndpoint, requestData: any): string {
  const hasRequestBody = requestData && Object.keys(requestData).length > 0;
  const method = endpoint.method.toLowerCase();

  // Build the URL with path parameters replaced
  let url = `\`\${BASE_URL}${endpoint.path}\``;

  // Extract path parameters if any
  const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
  if (pathParams.length > 0 && requestData) {
    // Replace path params in URL
    pathParams.forEach(param => {
      url = url.replace(`{${param.name}}`, `\${${JSON.stringify(requestData[param.name])}}`);
    });
  }

  // Handle different HTTP methods
  if (method === 'get' || method === 'delete') {
    // Query parameters for GET/DELETE
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    if (queryParams.length > 0 && requestData) {
      const paramsObj = queryParams.reduce((acc: any, param) => {
        if (requestData[param.name] !== undefined) {
          acc[param.name] = requestData[param.name];
        }
        return acc;
      }, {});

      if (Object.keys(paramsObj).length > 0) {
        return `    const response = await axios.${method}(${url}, {
      params: ${JSON.stringify(paramsObj, null, 6)}
    });`;
      }
    }

    return `    const response = await axios.${method}(${url});`;
  } else {
    // POST, PUT, PATCH with request body
    if (hasRequestBody) {
      return `    const response = await axios.${method}(${url}, ${JSON.stringify(requestData, null, 6)});`;
    }
    return `    const response = await axios.${method}(${url});`;
  }
}

function generateAssertions(assertions: string[], expectedStatus: number, testType: string): string {
  const lines: string[] = [];

  // Handle error cases differently
  if (testType === 'error' || testType === 'validation' || expectedStatus >= 400) {
    lines.push(`    try {`);
    lines.push(`      // Request should fail`);
    lines.push(`      throw new Error('Request should have failed');`);
    lines.push(`    } catch (error: any) {`);
    lines.push(`      expect(error.response.status).toBe(${expectedStatus});`);

    assertions.forEach(assertion => {
      lines.push(`      // ${assertion}`);
      if (assertion.toLowerCase().includes('error') || assertion.toLowerCase().includes('message')) {
        lines.push(`      expect(error.response.data).toHaveProperty('error');`);
      }
    });

    lines.push(`    }`);
  } else {
    // Success case
    lines.push(`    expect(response.status).toBe(${expectedStatus});`);

    assertions.forEach(assertion => {
      lines.push(`    // ${assertion}`);

      // Try to generate meaningful assertions based on the description
      if (assertion.toLowerCase().includes('id') || assertion.toLowerCase().includes('identifier')) {
        lines.push(`    expect(response.data).toHaveProperty('id');`);
      }
      if (assertion.toLowerCase().includes('array') || assertion.toLowerCase().includes('list')) {
        lines.push(`    expect(Array.isArray(response.data)).toBe(true);`);
      }
      if (assertion.toLowerCase().includes('not empty') || assertion.toLowerCase().includes('not null')) {
        lines.push(`    expect(response.data).toBeDefined();`);
      }
    });

    // Add a generic data check if no specific assertions
    if (assertions.length === 0) {
      lines.push(`    expect(response.data).toBeDefined();`);
    }
  }

  return lines.join('\n');
}

export function generateFilename(endpoint: ParsedEndpoint): string {
  // Create a readable filename from the endpoint
  // e.g., /api/v1/users/{id} -> users-id.test.ts
  const pathParts = endpoint.path.split('/').filter(p => p && !p.startsWith('{'));
  const name = pathParts.join('-') || endpoint.method.toLowerCase();

  return `${name}.test.ts`;
}
