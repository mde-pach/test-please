import type { APITest, Assertion } from '@/types/test-format';

/**
 * Generates a .bru file content from an APITest definition
 */
export function generateBruFile(test: APITest, baseUrl?: string): string {
  const sections: string[] = [];

  // Meta section
  sections.push(`meta {
  name: ${test.name}
  type: http
  seq: ${test.metadata?.tags?.includes('priority-high') ? 1 : 2}
}`);

  // HTTP method and URL
  const method = test.request.method.toLowerCase();
  const url = buildUrl(test.request.url, test.request.queryParams, baseUrl);
  sections.push(`${method} {
  url: ${url}
  body: ${test.request.body?.type || 'none'}
  auth: none
}`);

  // Query params (if any and not in URL)
  if (test.request.queryParams && Object.keys(test.request.queryParams).length > 0) {
    sections.push(`params:query {${formatKeyValuePairs(test.request.queryParams)}\n}`);
  }

  // Headers
  if (test.request.headers && Object.keys(test.request.headers).length > 0) {
    sections.push(`headers {${formatKeyValuePairs(test.request.headers)}\n}`);
  }

  // Request body
  if (test.request.body && test.request.body.type !== 'none') {
    sections.push(formatBody(test.request.body));
  }

  // Pre-request script (setup)
  const preRequestScript = generatePreRequestScript(test);
  if (preRequestScript) {
    sections.push(`script:pre-request {
${preRequestScript}
}`);
  }

  // Post-response script (variable extraction for story tests)
  const postResponseScript = generatePostResponseScript(test);
  if (postResponseScript) {
    sections.push(`script:post-response {
${postResponseScript}
}`);
  }

  // Tests (assertions)
  const testsScript = generateTestsScript(test.assertions, test.testType);
  if (testsScript) {
    sections.push(`tests {
${testsScript}
}`);
  }

  // Documentation
  if (test.description) {
    sections.push(`docs {
  ${test.description}
}`);
  }

  return sections.join('\n\n');
}

/**
 * Build URL with query params and base URL
 */
function buildUrl(url: string, queryParams?: Record<string, string>, baseUrl?: string): string {
  let fullUrl = url;

  // Add base URL if not absolute
  if (baseUrl && !url.startsWith('http')) {
    fullUrl = `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  // Query params are handled in params:query section, so don't add them to URL
  return fullUrl;
}

/**
 * Format key-value pairs for headers, query params, etc.
 */
function formatKeyValuePairs(obj: Record<string, string>): string {
  return '\n' + Object.entries(obj)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');
}

/**
 * Format request body based on type
 */
function formatBody(body: { type: string; data: any }): string {
  switch (body.type) {
    case 'json':
      return `body:json {
${JSON.stringify(body.data, null, 2).split('\n').map(line => '  ' + line).join('\n')}
}`;
    case 'form':
      return `body:form-urlencoded {${formatKeyValuePairs(body.data)}\n}`;
    case 'text':
      return `body:text {
  ${body.data}
}`;
    default:
      return '';
  }
}

/**
 * Generate pre-request script for test setup
 */
function generatePreRequestScript(test: APITest): string {
  const scripts: string[] = [];

  // Add timestamp for unique data
  scripts.push('// Set timestamp for unique test data');
  scripts.push('bru.setVar("timestamp", Date.now());');
  scripts.push('');

  // For story tests, add setup logic
  if (test.category === 'story' && test.steps) {
    scripts.push('// Story test setup');
    scripts.push('// Variables will be extracted and passed between steps');
    scripts.push('');
  }

  // For tests that need setup data (e.g., GET after POST)
  if (test.testType === 'success' && test.request.method === 'GET') {
    scripts.push('// Ensure test data exists (may need to create via POST first)');
    scripts.push('// Check if setup is needed based on test context');
    scripts.push('');
  }

  // Add custom setup hints based on test metadata
  if (test.metadata?.tags?.includes('requires-auth')) {
    scripts.push('// TODO: Add authentication token');
    scripts.push('// bru.setVar("authToken", "your-token-here");');
    scripts.push('');
  }

  return scripts.join('\n').trim();
}

/**
 * Generate post-response script for variable extraction
 */
function generatePostResponseScript(test: APITest): string {
  const scripts: string[] = [];

  // For story tests, extract variables for next steps
  if (test.category === 'story' && test.steps) {
    for (const step of test.steps) {
      if (step.extractVariables && step.extractVariables.length > 0) {
        scripts.push(`// Extract variables from step: ${step.name}`);
        for (const varExtract of step.extractVariables) {
          switch (varExtract.source) {
            case 'jsonPath':
              scripts.push(`// bru.setVar("${varExtract.name}", res.getBody()${varExtract.path?.replace('$', '')});`);
              break;
            case 'header':
              scripts.push(`// bru.setVar("${varExtract.name}", res.getHeader("${varExtract.headerName}"));`);
              break;
            case 'body':
              scripts.push(`// bru.setVar("${varExtract.name}", res.getBody().${varExtract.name});`);
              break;
          }
        }
        scripts.push('');
      }
    }
  }

  // Extract common response data for reuse
  if (test.request.method === 'POST' && test.testType === 'success') {
    scripts.push('// Extract created resource ID for subsequent tests');
    scripts.push('// const body = res.getBody();');
    scripts.push('// if (body.id) bru.setVar("createdId", body.id);');
    scripts.push('');
  }

  return scripts.join('\n').trim();
}

/**
 * Generate tests script (assertions)
 */
function generateTestsScript(assertions: Assertion[], testType: string): string {
  const tests: string[] = [];

  for (const assertion of assertions) {
    const testCode = generateAssertionTest(assertion);
    if (testCode) {
      tests.push(testCode);
    }
  }

  return tests.join('\n\n');
}

/**
 * Generate individual test assertion
 */
function generateAssertionTest(assertion: Assertion): string {
  const description = assertion.description || `Test ${assertion.type}`;

  switch (assertion.type) {
    case 'status':
      return `test("${description}", function() {
  expect(res.getStatus()).to.equal(${assertion.value});
});`;

    case 'header':
      if (assertion.operator === 'equals') {
        return `test("${description}", function() {
  expect(res.getHeader("${assertion.field}")).to.equal("${assertion.value}");
});`;
      } else if (assertion.operator === 'exists') {
        return `test("${description}", function() {
  expect(res.getHeader("${assertion.field}")).to.exist;
});`;
      }
      break;

    case 'body':
      if (assertion.operator === 'equals') {
        return `test("${description}", function() {
  expect(res.getBody()).to.deep.equal(${JSON.stringify(assertion.value)});
});`;
      }
      break;

    case 'jsonPath':
      const path = assertion.field?.replace('$.', '').replace(/\[(\d+)\]/g, '[$1]');
      if (assertion.operator === 'equals') {
        return `test("${description}", function() {
  const body = res.getBody();
  expect(body.${path}).to.equal(${JSON.stringify(assertion.value)});
});`;
      } else if (assertion.operator === 'exists') {
        return `test("${description}", function() {
  const body = res.getBody();
  expect(body.${path}).to.exist;
});`;
      } else if (assertion.operator === 'contains') {
        return `test("${description}", function() {
  const body = res.getBody();
  expect(body.${path}).to.include(${JSON.stringify(assertion.value)});
});`;
      }
      break;

    case 'responseTime':
      return `test("${description}", function() {
  expect(res.getResponseTime()).to.be.below(${assertion.value});
});`;

    case 'schema':
      // Basic type checking
      return `test("${description}", function() {
  const body = res.getBody();
  expect(body).to.be.an('object');
  // TODO: Add detailed schema validation
});`;
  }

  return `// TODO: Implement assertion for ${assertion.type} ${assertion.operator}`;
}

/**
 * Generate collection-level bruno.json file
 */
export function generateCollectionConfig(name: string, version: string = '1'): string {
  return JSON.stringify({
    version,
    name,
    type: 'collection',
  }, null, 2);
}

/**
 * Generate environment file (.bru format)
 */
export function generateEnvironmentFile(name: string, variables: Record<string, string>): string {
  const vars = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');

  return `vars {
${vars}
}`;
}
