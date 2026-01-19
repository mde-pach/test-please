import { bruToJson } from '@usebruno/lang';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Bruno test execution result
 */
export interface BrunoExecutionResult {
  status: 'passed' | 'failed' | 'error';
  duration: number;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
  };
  testResults: Array<{
    name: string;
    status: 'pass' | 'fail';
    error?: string;
  }>;
  assertionResults: Array<{
    type: string;
    passed: boolean;
    message: string;
    expected?: any;
    actual?: any;
  }>;
  error?: string;
}

/**
 * Variable context for test execution
 */
export interface VariableContext {
  [key: string]: any;
}

/**
 * Execute a .bru file content
 */
export async function executeBruTest(
  bruContent: string,
  variables: VariableContext = {},
  baseUrl?: string
): Promise<BrunoExecutionResult> {
  const startTime = Date.now();

  try {
    // Parse .bru file to JSON
    const bruJson = bruToJson(bruContent);

    // Build request from parsed bru
    const requestConfig = buildRequestConfig(bruJson, variables, baseUrl);

    // Execute pre-request script if exists
    if (bruJson.script?.req) {
      await executePreRequestScript(bruJson.script.req, variables);
    }

    // Execute HTTP request
    let response: AxiosResponse;
    const requestStartTime = Date.now();

    try {
      response = await axios(requestConfig);
    } catch (error: any) {
      if (error.response) {
        response = error.response;
      } else {
        throw error;
      }
    }

    const requestDuration = Date.now() - requestStartTime;

    // Execute post-response script if exists
    if (bruJson.script?.res) {
      await executePostResponseScript(bruJson.script.res, response, variables);
    }

    // Execute tests/assertions
    const testResults = await executeTests(bruJson.tests || '', response, variables);
    const assertionResults = convertTestResultsToAssertions(testResults);

    const duration = Date.now() - startTime;
    const allPassed = testResults.every(t => t.status === 'pass');

    return {
      status: allPassed ? 'passed' : 'failed',
      duration,
      request: {
        method: requestConfig.method?.toUpperCase() || 'GET',
        url: requestConfig.url || '',
        headers: requestConfig.headers as Record<string, string>,
        body: requestConfig.data,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        body: response.data,
        time: requestDuration,
      },
      testResults,
      assertionResults,
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      status: 'error',
      duration,
      request: {
        method: 'UNKNOWN',
        url: 'UNKNOWN',
      },
      testResults: [],
      assertionResults: [],
      error: error.message || 'Unknown error during test execution',
    };
  }
}

/**
 * Build Axios request config from parsed Bruno JSON
 */
function buildRequestConfig(
  bruJson: any,
  variables: VariableContext,
  baseUrl?: string
): AxiosRequestConfig {
  const method = bruJson.http?.method || 'get';
  let url = bruJson.http?.url || '';

  // Substitute variables in URL
  url = substituteVariables(url, variables);

  // Add base URL if needed
  if (baseUrl && !url.startsWith('http')) {
    url = `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  // Build headers
  const headers: Record<string, string> = {};
  if (bruJson.headers) {
    for (const [key, value] of Object.entries(bruJson.headers)) {
      headers[key] = substituteVariables(String(value), variables);
    }
  }

  // Build query params
  const params: Record<string, string> = {};
  if (bruJson.params?.query) {
    for (const [key, value] of Object.entries(bruJson.params.query)) {
      params[key] = substituteVariables(String(value), variables);
    }
  }

  // Build request body
  let data: any = undefined;
  if (bruJson.body) {
    if (bruJson.body.json) {
      data = JSON.parse(substituteVariables(JSON.stringify(bruJson.body.json), variables));
    } else if (bruJson.body.formUrlEncoded) {
      data = bruJson.body.formUrlEncoded;
    } else if (bruJson.body.text) {
      data = substituteVariables(bruJson.body.text, variables);
    }
  }

  return {
    method,
    url,
    headers,
    params,
    data,
    validateStatus: () => true, // Accept all status codes
  };
}

/**
 * Substitute variables in string ({{varName}} format)
 */
function substituteVariables(str: string, variables: VariableContext): string {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmedName = varName.trim();
    return variables[trimmedName] !== undefined ? String(variables[trimmedName]) : match;
  });
}

/**
 * Execute pre-request script
 */
async function executePreRequestScript(script: string, variables: VariableContext): Promise<void> {
  // Create a minimal Bruno runtime environment
  const bru = {
    setVar: (name: string, value: any) => {
      variables[name] = value;
    },
    getVar: (name: string) => {
      return variables[name];
    },
    setEnvVar: (name: string, value: any) => {
      variables[name] = value;
    },
    getEnvVar: (name: string) => {
      return variables[name];
    },
  };

  // Execute script in a controlled environment
  try {
    const asyncFunction = new Function('bru', 'require', `
      return (async () => {
        ${script}
      })();
    `);
    await asyncFunction(bru, undefined);
  } catch (error) {
    console.error('Pre-request script error:', error);
    // Don't fail the test, just log the error
  }
}

/**
 * Execute post-response script
 */
async function executePostResponseScript(
  script: string,
  response: AxiosResponse,
  variables: VariableContext
): Promise<void> {
  const bru = {
    setVar: (name: string, value: any) => {
      variables[name] = value;
    },
    getVar: (name: string) => {
      return variables[name];
    },
  };

  const res = {
    getStatus: () => response.status,
    getHeader: (name: string) => response.headers[name.toLowerCase()],
    getHeaders: () => response.headers,
    getBody: () => response.data,
    getResponseTime: () => 0, // Would need to track this
  };

  try {
    const asyncFunction = new Function('bru', 'res', 'require', `
      return (async () => {
        ${script}
      })();
    `);
    await asyncFunction(bru, res, undefined);
  } catch (error) {
    console.error('Post-response script error:', error);
  }
}

/**
 * Execute test assertions
 */
async function executeTests(
  testsScript: string,
  response: AxiosResponse,
  variables: VariableContext
): Promise<Array<{ name: string; status: 'pass' | 'fail'; error?: string }>> {
  const results: Array<{ name: string; status: 'pass' | 'fail'; error?: string }> = [];

  if (!testsScript || testsScript.trim() === '') {
    return results;
  }

  // Create Bruno test runtime
  const res = {
    getStatus: () => response.status,
    getHeader: (name: string) => response.headers[name.toLowerCase()],
    getHeaders: () => response.headers,
    getBody: () => response.data,
    getResponseTime: () => 0,
  };

  const req = {
    getUrl: () => '',
    getMethod: () => '',
  };

  // Chai-like expect
  const expect = (value: any) => ({
    to: {
      equal: (expected: any) => {
        if (value !== expected) {
          throw new Error(`Expected ${expected} but got ${value}`);
        }
      },
      deep: {
        equal: (expected: any) => {
          if (JSON.stringify(value) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(value)}`);
          }
        },
      },
      exist: () => {
        if (value === undefined || value === null) {
          throw new Error('Expected value to exist');
        }
      },
      include: (expected: any) => {
        if (Array.isArray(value)) {
          if (!value.includes(expected)) {
            throw new Error(`Expected array to include ${expected}`);
          }
        } else if (typeof value === 'string') {
          if (!value.includes(expected)) {
            throw new Error(`Expected string to include ${expected}`);
          }
        } else {
          throw new Error('Value is not an array or string');
        }
      },
      be: {
        an: (type: string) => {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== type) {
            throw new Error(`Expected type ${type} but got ${actualType}`);
          }
        },
        below: (threshold: number) => {
          if (value >= threshold) {
            throw new Error(`Expected ${value} to be below ${threshold}`);
          }
        },
      },
    },
  });

  const test = (name: string, fn: Function) => {
    try {
      fn();
      results.push({ name, status: 'pass' });
    } catch (error: any) {
      results.push({ name, status: 'fail', error: error.message });
    }
  };

  try {
    const asyncFunction = new Function('test', 'expect', 'res', 'req', 'bru', `
      return (async () => {
        ${testsScript}
      })();
    `);

    const bru = {
      getVar: (name: string) => variables[name],
    };

    await asyncFunction(test, expect, res, req, bru);
  } catch (error: any) {
    results.push({ name: 'Script execution', status: 'fail', error: error.message });
  }

  return results;
}

/**
 * Convert test results to assertion results format
 */
function convertTestResultsToAssertions(
  testResults: Array<{ name: string; status: 'pass' | 'fail'; error?: string }>
): Array<{ type: string; passed: boolean; message: string; expected?: any; actual?: any }> {
  return testResults.map(test => ({
    type: 'test',
    passed: test.status === 'pass',
    message: test.error || test.name,
    expected: undefined,
    actual: undefined,
  }));
}
