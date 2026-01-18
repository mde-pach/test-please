import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { ParsedEndpoint, APITest, Assertion } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function generateStructuredTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  collectionId: string
): Promise<APITest[]> {
  const prompt = buildStructuredTestPrompt(endpoint, apiInfo);

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      prompt,
      temperature: 0.7,
    });

    // Parse the AI response to extract structured tests
    const tests = parseStructuredTestsFromResponse(text, endpoint, apiInfo, collectionId);
    return tests;
  } catch (error) {
    console.error('Error generating structured tests:', error);
    throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildStructuredTestPrompt(
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

function parseStructuredTestsFromResponse(
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
        },
      } as APITest,
    ];
  }
}
