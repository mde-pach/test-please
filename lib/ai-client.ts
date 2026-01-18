import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { ParsedEndpoint, GeneratedTestCase } from '@/types';

export async function generateTestCasesForEndpoint(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string }
): Promise<GeneratedTestCase[]> {
  const prompt = buildTestGenerationPrompt(endpoint, apiInfo);

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      prompt,
      temperature: 0.7,
    });

    // Parse the AI response to extract test cases
    const testCases = parseTestCasesFromResponse(text, endpoint);
    return testCases;
  } catch (error) {
    console.error('Error generating test cases:', error);
    throw new Error(`Failed to generate test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildTestGenerationPrompt(
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

  return `You are an expert API testing engineer. Generate comprehensive test cases for the following API endpoint.

API Information:
- API: ${apiInfo.title} (v${apiInfo.version})
- Base URL: ${apiInfo.baseUrl || 'Not specified'}

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
2. **Validation errors** - Missing required fields, invalid data types, constraint violations
3. **Edge cases** - Boundary values, empty strings, special characters, max lengths
4. **Error scenarios** - Expected error responses based on the API spec

For EACH test case, provide in this EXACT JSON format:
{
  "testName": "should [action] when [condition]",
  "description": "Brief explanation of what this test verifies",
  "testType": "success|error|validation|edge-case",
  "requestData": { object with request parameters/body or null if not applicable },
  "expectedStatus": 200,
  "assertions": ["assertion description 1", "assertion description 2"]
}

Return ONLY a valid JSON array of test case objects. Do not include any markdown formatting, code blocks, or explanatory text.`;
}

function parseTestCasesFromResponse(response: string, endpoint: ParsedEndpoint): GeneratedTestCase[] {
  try {
    // Clean up the response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    const parsedCases = JSON.parse(cleaned);

    if (!Array.isArray(parsedCases)) {
      throw new Error('Response is not an array');
    }

    // Map to our GeneratedTestCase type
    return parsedCases.map((tc: any) => ({
      testName: tc.testName || 'Unnamed test',
      description: tc.description || '',
      endpoint: endpoint.path,
      method: endpoint.method,
      testType: tc.testType || 'success',
      requestData: tc.requestData,
      expectedStatus: tc.expectedStatus || 200,
      assertions: tc.assertions || [],
    }));
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response);

    // Fallback: return a basic test case
    return [
      {
        testName: `should test ${endpoint.method} ${endpoint.path}`,
        description: 'Auto-generated basic test case',
        endpoint: endpoint.path,
        method: endpoint.method,
        testType: 'success',
        expectedStatus: 200,
        assertions: ['Response should be successful'],
      },
    ];
  }
}
