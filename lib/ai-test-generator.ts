import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { ParsedEndpoint, APITest, Assertion, TestStep } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate both contract and story tests for an endpoint
 */
export async function generateStructuredTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  collectionId: string,
  allEndpoints?: ParsedEndpoint[]
): Promise<APITest[]> {
  const contractTests = await generateContractTests(endpoint, apiInfo, collectionId);

  // Generate story tests if we have related endpoints
  if (allEndpoints && allEndpoints.length > 1) {
    try {
      const storyTests = await generateStoryTests(endpoint, apiInfo, collectionId, allEndpoints);
      return [...contractTests, ...storyTests];
    } catch (error) {
      console.error('Failed to generate story tests:', error);
      // Return only contract tests if story test generation fails
      return contractTests;
    }
  }

  return contractTests;
}

/**
 * Generate contract tests - single endpoint validation
 */
export async function generateContractTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  collectionId: string
): Promise<APITest[]> {
  const prompt = buildContractTestPrompt(endpoint, apiInfo);

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt,
      temperature: 0.7,
    });

    // Parse the AI response to extract structured tests
    const tests = parseContractTestsFromResponse(text, endpoint, apiInfo, collectionId);
    return tests;
  } catch (error) {
    console.error('Error generating contract tests:', error);
    throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate story tests - business scenario flows
 */
export async function generateStoryTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  collectionId: string,
  allEndpoints: ParsedEndpoint[]
): Promise<APITest[]> {
  const relatedEndpoints = findRelatedEndpoints(endpoint, allEndpoints);

  // Only generate story tests if we have related endpoints
  if (relatedEndpoints.length === 0) {
    return [];
  }

  const prompt = buildStoryTestPrompt(endpoint, apiInfo, relatedEndpoints);

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt,
      temperature: 0.8, // Higher temperature for creative scenarios
    });

    const tests = parseStoryTestsFromResponse(text, endpoint, apiInfo, collectionId);
    return tests;
  } catch (error) {
    console.error('Error generating story tests:', error);
    return []; // Return empty array on failure
  }
}

/**
 * Find endpoints related to the current endpoint for multi-step flows
 */
function findRelatedEndpoints(
  endpoint: ParsedEndpoint,
  allEndpoints: ParsedEndpoint[]
): ParsedEndpoint[] {
  const related: ParsedEndpoint[] = [];

  // Extract resource name from path (e.g., /users/{id} -> users)
  const resourceMatch = endpoint.path.match(/^\/([^/]+)/);
  const resourceName = resourceMatch ? resourceMatch[1] : null;

  if (!resourceName) return related;

  allEndpoints.forEach(ep => {
    // Skip the current endpoint
    if (ep.path === endpoint.path && ep.method === endpoint.method) {
      return;
    }

    // Include endpoints with same resource path
    if (ep.path.startsWith(`/${resourceName}`)) {
      related.push(ep);
      return;
    }

    // Include endpoints with shared tags
    if (endpoint.tags && ep.tags) {
      const sharedTags = endpoint.tags.filter(tag => ep.tags?.includes(tag));
      if (sharedTags.length > 0) {
        related.push(ep);
      }
    }
  });

  return related.slice(0, 5); // Limit to 5 related endpoints
}

function buildContractTestPrompt(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string }
): string {
  const parametersInfo = endpoint.parameters?.length
    ? endpoint.parameters.map(p => `  - ${p.name} (${p.in}): ${p.required ? 'required' : 'optional'} - ${JSON.stringify(p.schema)}`).join('\n')
    : 'None';

  const requestBodyInfo = endpoint.requestBody
    ? JSON.stringify(endpoint.requestBody.content, null, 2)
    : 'None';

  const responsesInfo = Object.entries(endpoint.responses)
    .map(([status, response]) => `  ${status}: ${response.description}${response.content ? '\n    Schema: ' + JSON.stringify(Object.keys(response.content)) : ''}`)
    .join('\n');

  return `You are an expert API testing engineer. Generate comprehensive test cases in a structured format for the following API endpoint.

API Information:
- API: ${apiInfo.title} (v${apiInfo.version})
- Base URL: ${apiInfo.baseUrl || 'https://api.example.com'}

Endpoint Details:
- Path: ${endpoint.path}
- Method: ${endpoint.method}
- Summary: ${endpoint.summary || 'Not provided'}
- Description: ${endpoint.description || 'Not provided'}

Parameters:
${parametersInfo}

Request Body Schema:
${requestBodyInfo}

Response Schemas:
${responsesInfo}

Generate 4-6 test cases covering:
1. **Happy path** - Valid request with expected success response
2. **Validation errors** - Missing required fields, invalid data types
3. **Edge cases** - Boundary values, empty strings, special characters
4. **Error scenarios** - Expected error responses

For EACH test case, provide this EXACT JSON structure:
{
  "name": "should [action] when [condition]",
  "description": "Brief explanation",
  "testType": "success|error|validation|edge-case",
  "request": {
    "headers": { "Content-Type": "application/json" },
    "queryParams": { "key": "value" } or null,
    "pathParams": { "id": "123" } or null,
    "body": {
      "type": "json|form|text|none",
      "data": { /* request body data */ } or null
    }
  },
  "assertions": [
    {
      "type": "status",
      "operator": "equals",
      "value": 200,
      "description": "Response status should be 200"
    },
    {
      "type": "jsonPath",
      "field": "$.data.id",
      "operator": "exists",
      "description": "Response should contain data.id"
    }
  ]
}

Assertion types available:
- "status": Check HTTP status code
- "header": Check response header value
- "body": Check full body match
- "jsonPath": Check specific JSON field (use $.path.to.field notation)
- "responseTime": Check response time in ms
- "schema": Validate against JSON schema

Operators available:
- "equals", "notEquals", "contains", "notContains", "greaterThan", "lessThan", "exists", "notExists", "matches"

Return ONLY a valid JSON array of test case objects. No markdown, no explanations.`;
}

/**
 * Build prompt for story tests (business scenarios)
 */
function buildStoryTestPrompt(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  relatedEndpoints: ParsedEndpoint[]
): string {
  const endpointsContext = [endpoint, ...relatedEndpoints]
    .map(ep => `  - ${ep.method} ${ep.path}: ${ep.summary || 'No description'}`)
    .join('\n');

  return `You are an expert API testing engineer. Generate business scenario tests (user stories) that involve multiple API calls in sequence.

API Information:
- API: ${apiInfo.title} (v${apiInfo.version})
- Base URL: ${apiInfo.baseUrl || 'https://api.example.com'}

Primary Endpoint:
- Path: ${endpoint.path}
- Method: ${endpoint.method}
- Summary: ${endpoint.summary || 'Not provided'}

Related Available Endpoints:
${endpointsContext}

Generate 1-2 realistic business scenario tests that chain multiple API calls together. Examples:
- "Create user, then fetch user details, then update profile"
- "Add item to cart, update quantity, proceed to checkout"
- "Create resource, verify creation, then delete resource"

For EACH story test, provide this EXACT JSON structure:
{
  "name": "should [complete business scenario]",
  "description": "Business scenario description",
  "testType": "success",
  "steps": [
    {
      "id": "step1",
      "name": "Create user",
      "order": 1,
      "request": {
        "method": "POST",
        "url": "/users",
        "headers": { "Content-Type": "application/json" },
        "body": {
          "type": "json",
          "data": { "name": "Test User", "email": "test@example.com" }
        }
      },
      "assertions": [
        {
          "type": "status",
          "operator": "equals",
          "value": 201,
          "description": "User created successfully"
        }
      ],
      "extractVariables": [
        {
          "name": "userId",
          "source": "jsonPath",
          "path": "$.id"
        }
      ]
    },
    {
      "id": "step2",
      "name": "Fetch user details",
      "order": 2,
      "request": {
        "method": "GET",
        "url": "/users/{{userId}}",
        "headers": { "Content-Type": "application/json" }
      },
      "assertions": [
        {
          "type": "status",
          "operator": "equals",
          "value": 200,
          "description": "User found"
        },
        {
          "type": "jsonPath",
          "field": "$.email",
          "operator": "equals",
          "value": "test@example.com",
          "description": "Email matches"
        }
      ],
      "dependencies": ["step1"]
    }
  ]
}

IMPORTANT:
- Use {{variableName}} in URLs/bodies to reference extracted variables
- Each step can extract variables for use in subsequent steps
- Dependencies array lists step IDs that must complete before this step
- Only use endpoints from the available endpoints list above

Return ONLY a valid JSON array of story test objects. No markdown, no explanations.`;
}

function parseContractTestsFromResponse(
  response: string,
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  collectionId: string
): APITest[] {
  try {
    // Clean up the response
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    const parsedTests = JSON.parse(cleaned);

    if (!Array.isArray(parsedTests)) {
      throw new Error('Response is not an array');
    }

    // Convert to APITest format
    return parsedTests.map((test: any) => {
      const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
      const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];

      // Build the full URL with path parameters replaced
      let url = `${apiInfo.baseUrl || 'https://api.example.com'}${endpoint.path}`;

      // Replace path parameters in URL
      if (test.request?.pathParams) {
        Object.entries(test.request.pathParams).forEach(([key, value]) => {
          url = url.replace(`{${key}}`, String(value));
        });
      }

      return {
        id: uuidv4(),
        name: test.name || 'Unnamed test',
        description: test.description,
        collectionId,
        category: 'contract', // Default to contract tests
        request: {
          method: endpoint.method,
          url,
          headers: test.request?.headers || { 'Content-Type': 'application/json' },
          queryParams: test.request?.queryParams || undefined,
          pathParams: test.request?.pathParams || undefined,
          body: test.request?.body || { type: 'none', data: null },
        },
        assertions: test.assertions?.map((a: any) => ({
          type: a.type || 'status',
          field: a.field,
          operator: a.operator || 'equals',
          value: a.value,
          description: a.description || '',
        })) || [],
        testType: test.testType || 'success',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: endpoint.tags || [],
          endpointPath: endpoint.path, // Add endpoint path for grouping
        },
      } as APITest;
    });
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response);

    // Fallback: return a basic test
    return [
      {
        id: uuidv4(),
        name: `should test ${endpoint.method} ${endpoint.path}`,
        description: 'Auto-generated basic test case',
        collectionId,
        category: 'contract',
        request: {
          method: endpoint.method,
          url: `${apiInfo.baseUrl || 'https://api.example.com'}${endpoint.path}`,
          headers: { 'Content-Type': 'application/json' },
          body: { type: 'none', data: null },
        },
        assertions: [
          {
            type: 'status',
            operator: 'equals',
            value: 200,
            description: 'Response status should be 200',
          },
        ],
        testType: 'success',
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          endpointPath: endpoint.path,
        },
      } as APITest,
    ];
  }
}

/**
 * Parse story tests from AI response
 */
function parseStoryTestsFromResponse(
  response: string,
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  collectionId: string
): APITest[] {
  try {
    // Clean up the response
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    const parsedTests = JSON.parse(cleaned);

    if (!Array.isArray(parsedTests)) {
      throw new Error('Response is not an array');
    }

    // Convert to APITest format with steps
    return parsedTests.map((test: any) => {
      // Process steps to build full URLs
      const steps: TestStep[] = test.steps?.map((step: any) => {
        let stepUrl = step.request?.url || '';

        // Build full URL if relative path
        if (stepUrl.startsWith('/')) {
          stepUrl = `${apiInfo.baseUrl || 'https://api.example.com'}${stepUrl}`;
        }

        return {
          id: step.id || uuidv4(),
          name: step.name || 'Unnamed step',
          description: step.description,
          order: step.order || 0,
          request: {
            method: step.request?.method || 'GET',
            url: stepUrl,
            headers: step.request?.headers || { 'Content-Type': 'application/json' },
            queryParams: step.request?.queryParams,
            pathParams: step.request?.pathParams,
            body: step.request?.body || { type: 'none', data: null },
          },
          assertions: step.assertions?.map((a: any) => ({
            type: a.type || 'status',
            field: a.field,
            operator: a.operator || 'equals',
            value: a.value,
            description: a.description || '',
          })) || [],
          extractVariables: step.extractVariables || [],
          dependencies: step.dependencies || [],
        };
      }) || [];

      return {
        id: uuidv4(),
        name: test.name || 'Unnamed story test',
        description: test.description,
        collectionId,
        category: 'story', // Mark as story test
        request: {
          method: endpoint.method,
          url: `${apiInfo.baseUrl || 'https://api.example.com'}${endpoint.path}`,
          headers: { 'Content-Type': 'application/json' },
          body: { type: 'none', data: null },
        },
        assertions: [], // Assertions are in steps
        testType: test.testType || 'success',
        steps, // Add steps for multi-step test
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: endpoint.tags || [],
          endpointPath: endpoint.path,
        },
      } as APITest;
    });
  } catch (error) {
    console.error('Failed to parse story test response:', error);
    console.error('Raw response:', response);
    return []; // Return empty array on parse failure
  }
}
