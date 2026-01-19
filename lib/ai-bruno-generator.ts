import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { ParsedEndpoint } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bruno test definition (for database storage)
 */
export interface BrunoTest {
  id: string;
  name: string;
  description?: string;
  category: 'contract' | 'story';
  testType: 'success' | 'error' | 'validation' | 'edge-case';
  bruContent: string; // The actual .bru file content
  endpointPath: string;
  method: string;
  tags: string[];
}

/**
 * Generate Bruno tests for an endpoint using AI
 */
export async function generateBrunoTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  allEndpoints?: ParsedEndpoint[]
): Promise<BrunoTest[]> {
  const contractTests = await generateBrunoContractTests(endpoint, apiInfo);

  // Generate story tests if we have related endpoints
  if (allEndpoints && allEndpoints.length > 1) {
    try {
      const relatedEndpoints = findRelatedEndpoints(endpoint, allEndpoints);
      if (relatedEndpoints.length > 0) {
        const storyTests = await generateBrunoStoryTests(endpoint, apiInfo, relatedEndpoints);
        return [...contractTests, ...storyTests];
      }
    } catch (error) {
      console.error('Failed to generate story tests:', error);
    }
  }

  return contractTests;
}

/**
 * Generate contract tests in .bru format
 */
async function generateBrunoContractTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string }
): Promise<BrunoTest[]> {
  const prompt = buildBrunoContractPrompt(endpoint, apiInfo);

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt,
      temperature: 0.7,
    });

    // Parse AI response to extract .bru test files
    const tests = parseBrunoTestsFromResponse(text, endpoint, 'contract');
    return tests;

  } catch (error) {
    console.error('Error generating Bruno contract tests:', error);
    throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate story tests in .bru format
 */
async function generateBrunoStoryTests(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  relatedEndpoints: ParsedEndpoint[]
): Promise<BrunoTest[]> {
  const prompt = buildBrunoStoryPrompt(endpoint, apiInfo, relatedEndpoints);

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt,
      temperature: 0.8,
    });

    const tests = parseBrunoTestsFromResponse(text, endpoint, 'story');
    return tests;

  } catch (error) {
    console.error('Error generating Bruno story tests:', error);
    return [];
  }
}

/**
 * Build AI prompt for Bruno contract tests
 */
function buildBrunoContractPrompt(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string }
): string {
  const parametersInfo = endpoint.parameters?.length
    ? endpoint.parameters.map(p => `  - ${p.name} (${p.in}): ${p.required ? 'required' : 'optional'}`).join('\n')
    : 'None';

  const requestBodyInfo = endpoint.requestBody
    ? JSON.stringify(endpoint.requestBody.content, null, 2)
    : 'None';

  return `You are an expert API testing engineer. Generate comprehensive test cases in Bruno .bru format for the following API endpoint.

API Information:
- API: ${apiInfo.title} (v${apiInfo.version})
- Base URL: ${apiInfo.baseUrl || 'https://api.example.com'}

Endpoint Details:
- Path: ${endpoint.path}
- Method: ${endpoint.method}
- Summary: ${endpoint.summary || 'Not provided'}

Parameters:
${parametersInfo}

Request Body Schema:
${requestBodyInfo}

Generate 4-6 test cases covering:
1. Happy path - valid request with expected success
2. Validation errors - missing required fields
3. Edge cases - boundary values, empty data
4. Error scenarios - expected error responses

For EACH test, provide a complete .bru file in this format:

---TEST_START---
name: should [action] when [condition]
description: Brief explanation
testType: success|error|validation|edge-case
---BRU_CONTENT---
meta {
  name: Test Name
  type: http
  seq: 1
}

${endpoint.method.toLowerCase()} {
  url: {{baseUrl}}${endpoint.path}
  body: json
  auth: none
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "field": "value"
  }
}

script:pre-request {
  // Set up test data
  bru.setVar("timestamp", Date.now());

  // For tests that need existing data (e.g., GET after POST)
  // Add setup logic here
}

tests {
  test("Status code is 200", function() {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response contains expected fields", function() {
    const body = res.getBody();
    expect(body).to.be.an('object');
    expect(body.id).to.exist;
  });
}
---TEST_END---

IMPORTANT:
- Include realistic test data in body:json blocks
- Add pre-request scripts that set up any required data
- Use proper Bruno test assertions with expect()
- Each test should be self-contained and runnable
- Include comments in scripts explaining the setup logic

Separate each test with ---TEST_START--- and ---TEST_END--- markers.`;
}

/**
 * Build AI prompt for Bruno story tests
 */
function buildBrunoStoryPrompt(
  endpoint: ParsedEndpoint,
  apiInfo: { title: string; version: string; baseUrl?: string },
  relatedEndpoints: ParsedEndpoint[]
): string {
  const endpointsContext = [endpoint, ...relatedEndpoints]
    .map(ep => `  - ${ep.method} ${ep.path}: ${ep.summary || 'No description'}`)
    .join('\n');

  return `You are an expert API testing engineer. Generate business scenario tests that chain multiple API calls together using Bruno .bru format.

API Information:
- API: ${apiInfo.title} (v${apiInfo.version})
- Base URL: ${apiInfo.baseUrl || 'https://api.example.com'}

Available Endpoints:
${endpointsContext}

Generate 1-2 realistic multi-step business scenarios. Examples:
- "Create user, then fetch user details, then update profile"
- "Add item to cart, update quantity, proceed to checkout"
- "Create resource, verify creation, then delete resource"

For EACH scenario test, provide this structure:

---TEST_START---
name: [Scenario name]
description: Multi-step flow description
testType: success
---BRU_CONTENT---
meta {
  name: Complete User Workflow
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/users
  body: json
  auth: none
}

body:json {
  {
    "name": "Test User {{timestamp}}",
    "email": "test{{timestamp}}@example.com"
  }
}

script:pre-request {
  // Step 1: Create test user
  bru.setVar("timestamp", Date.now());
}

script:post-response {
  // Extract user ID for next step
  const body = res.getBody();
  if (body.id) {
    bru.setVar("userId", body.id);
  }

  // NOTE: In a real multi-step flow, you would chain to the next request here
  // This is simplified for a single .bru file
}

tests {
  test("User created successfully", function() {
    expect(res.getStatus()).to.equal(201);
    const body = res.getBody();
    expect(body.id).to.exist;
    expect(body.name).to.include("Test User");
  });
}
---TEST_END---

IMPORTANT:
- Add comments explaining the multi-step flow
- Extract variables in post-response scripts for next steps
- Include realistic setup in pre-request scripts
- Document the intended flow even if Bruno executes single requests

Separate each test with ---TEST_START--- and ---TEST_END--- markers.`;
}

/**
 * Parse AI response to extract Bruno tests
 */
function parseBrunoTestsFromResponse(
  response: string,
  endpoint: ParsedEndpoint,
  category: 'contract' | 'story'
): BrunoTest[] {
  const tests: BrunoTest[] = [];
  const testMatches = response.matchAll(/---TEST_START---([\s\S]*?)---TEST_END---/g);

  for (const match of testMatches) {
    const testContent = match[1];

    // Extract metadata
    const nameMatch = testContent.match(/name:\s*(.+)/);
    const descMatch = testContent.match(/description:\s*(.+)/);
    const typeMatch = testContent.match(/testType:\s*(success|error|validation|edge-case)/);
    const bruMatch = testContent.match(/---BRU_CONTENT---([\s\S]*)/);

    if (nameMatch && bruMatch) {
      tests.push({
        id: uuidv4(),
        name: nameMatch[1].trim(),
        description: descMatch?.[1].trim(),
        category,
        testType: (typeMatch?.[1] as any) || 'success',
        bruContent: bruMatch[1].trim(),
        endpointPath: endpoint.path,
        method: endpoint.method,
        tags: endpoint.tags || [],
      });
    }
  }

  return tests;
}

/**
 * Find endpoints related to the current endpoint
 */
function findRelatedEndpoints(
  endpoint: ParsedEndpoint,
  allEndpoints: ParsedEndpoint[]
): ParsedEndpoint[] {
  const related: ParsedEndpoint[] = [];

  const resourceMatch = endpoint.path.match(/^\/([^/]+)/);
  const resourceName = resourceMatch ? resourceMatch[1] : null;

  if (!resourceName) return related;

  allEndpoints.forEach(ep => {
    if (ep.path === endpoint.path && ep.method === endpoint.method) {
      return;
    }

    if (ep.path.startsWith(`/${resourceName}`)) {
      related.push(ep);
      return;
    }

    if (endpoint.tags && ep.tags) {
      const sharedTags = endpoint.tags.filter(tag => ep.tags?.includes(tag));
      if (sharedTags.length > 0) {
        related.push(ep);
      }
    }
  });

  return related.slice(0, 5);
}
