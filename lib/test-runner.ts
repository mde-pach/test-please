import axios, { AxiosResponse, AxiosError } from 'axios';
import type { APITest, TestExecution, AssertionResult, Assertion } from '@/types';
import { StoryTestRunner } from './runners/story-test-runner';

export class TestRunner {
  private storyTestRunner: StoryTestRunner;

  constructor() {
    this.storyTestRunner = new StoryTestRunner();
  }

  async executeTest(test: APITest): Promise<TestExecution> {
    // Detect if this is a story test (multi-step)
    if (test.category === 'story' && test.steps && test.steps.length > 0) {
      return this.storyTestRunner.executeStoryTest(test);
    }

    // Execute as contract test (single request)
    return this.executeContractTest(test);
  }

  private async executeContractTest(test: APITest): Promise<TestExecution> {
    const startTime = Date.now();

    try {
      // Build request config
      const requestConfig: any = {
        method: test.request.method,
        url: test.request.url,
        headers: test.request.headers || {},
        validateStatus: () => true, // Don't throw on any status code
      };

      // Add query parameters
      if (test.request.queryParams && Object.keys(test.request.queryParams).length > 0) {
        requestConfig.params = test.request.queryParams;
      }

      // Add request body
      if (test.request.body && test.request.body.type !== 'none' && test.request.body.data) {
        requestConfig.data = test.request.body.data;

        // Set appropriate content type if not already set
        if (!requestConfig.headers['Content-Type']) {
          if (test.request.body.type === 'json') {
            requestConfig.headers['Content-Type'] = 'application/json';
          } else if (test.request.body.type === 'form') {
            requestConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          } else if (test.request.body.type === 'text') {
            requestConfig.headers['Content-Type'] = 'text/plain';
          }
        }
      }

      // Execute the request
      const response: AxiosResponse = await axios(requestConfig);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Validate assertions
      const assertionResults = this.validateAssertions(test.assertions, response, duration);

      // Determine overall status
      const allPassed = assertionResults.every(r => r.passed);
      const status = allPassed ? 'passed' : 'failed';

      return {
        testId: test.id,
        executedAt: new Date().toISOString(),
        status,
        duration,
        request: {
          method: requestConfig.method,
          url: requestConfig.url,
          headers: requestConfig.headers,
          body: requestConfig.data,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
          body: response.data,
          time: duration,
        },
        assertionResults,
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        testId: test.id,
        executedAt: new Date().toISOString(),
        status: 'error',
        duration,
        request: {
          method: test.request.method,
          url: test.request.url,
          headers: test.request.headers,
          body: test.request.body?.data,
        },
        assertionResults: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private validateAssertions(
    assertions: Assertion[],
    response: AxiosResponse,
    duration: number
  ): AssertionResult[] {
    return assertions.map(assertion => this.validateAssertion(assertion, response, duration));
  }

  private validateAssertion(
    assertion: Assertion,
    response: AxiosResponse,
    duration: number
  ): AssertionResult {
    try {
      switch (assertion.type) {
        case 'status':
          return this.validateStatusAssertion(assertion, response);

        case 'header':
          return this.validateHeaderAssertion(assertion, response);

        case 'body':
          return this.validateBodyAssertion(assertion, response);

        case 'jsonPath':
          return this.validateJsonPathAssertion(assertion, response);

        case 'responseTime':
          return this.validateResponseTimeAssertion(assertion, duration);

        case 'schema':
          return this.validateSchemaAssertion(assertion, response);

        default:
          return {
            assertion,
            passed: false,
            message: `Unknown assertion type: ${assertion.type}`,
          };
      }
    } catch (error) {
      return {
        assertion,
        passed: false,
        message: `Assertion validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private validateStatusAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    const actual = response.status;
    const expected = assertion.value;

    const passed = this.compare(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed
        ? assertion.description
        : `Expected status ${assertion.operator} ${expected}, got ${actual}`,
      actual,
      expected,
    };
  }

  private validateHeaderAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    if (!assertion.field) {
      return {
        assertion,
        passed: false,
        message: 'Header name not specified',
      };
    }

    const actual = response.headers[assertion.field.toLowerCase()];
    const expected = assertion.value;

    if (assertion.operator === 'exists') {
      const passed = actual !== undefined;
      return {
        assertion,
        passed,
        message: passed
          ? assertion.description
          : `Expected header '${assertion.field}' to exist`,
        actual: actual || null,
      };
    }

    if (assertion.operator === 'notExists') {
      const passed = actual === undefined;
      return {
        assertion,
        passed,
        message: passed
          ? assertion.description
          : `Expected header '${assertion.field}' to not exist`,
        actual: actual || null,
      };
    }

    const passed = this.compare(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed
        ? assertion.description
        : `Header '${assertion.field}' ${assertion.operator} ${expected}, got ${actual}`,
      actual,
      expected,
    };
  }

  private validateBodyAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    const actual = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);
    const expected = assertion.value;

    const passed = this.compare(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed
        ? assertion.description
        : `Body ${assertion.operator} failed`,
      actual,
      expected,
    };
  }

  private validateJsonPathAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    if (!assertion.field) {
      return {
        assertion,
        passed: false,
        message: 'JSON path not specified',
      };
    }

    // Simple JSON path implementation (supports $.path.to.field)
    const path = assertion.field.replace(/^\$\./, '').split('.');
    let actual: any = response.data;

    try {
      for (const key of path) {
        if (actual === null || actual === undefined) {
          actual = undefined;
          break;
        }
        actual = actual[key];
      }

      if (assertion.operator === 'exists') {
        const passed = actual !== undefined && actual !== null;
        return {
          assertion,
          passed,
          message: passed
            ? assertion.description
            : `Expected '${assertion.field}' to exist in response`,
          actual: actual || null,
        };
      }

      if (assertion.operator === 'notExists') {
        const passed = actual === undefined || actual === null;
        return {
          assertion,
          passed,
          message: passed
            ? assertion.description
            : `Expected '${assertion.field}' to not exist in response`,
          actual: actual || null,
        };
      }

      const passed = this.compare(actual, assertion.value, assertion.operator);

      return {
        assertion,
        passed,
        message: passed
          ? assertion.description
          : `Field '${assertion.field}' ${assertion.operator} ${assertion.value}, got ${actual}`,
        actual,
        expected: assertion.value,
      };
    } catch (error) {
      return {
        assertion,
        passed: false,
        message: `Failed to evaluate JSON path '${assertion.field}'`,
        actual: null,
      };
    }
  }

  private validateResponseTimeAssertion(assertion: Assertion, duration: number): AssertionResult {
    const actual = duration;
    const expected = assertion.value;

    const passed = this.compare(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed
        ? assertion.description
        : `Response time ${actual}ms ${assertion.operator} ${expected}ms`,
      actual,
      expected,
    };
  }

  private validateSchemaAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    // Basic schema validation - can be enhanced with libraries like ajv
    // For now, just check if response is an object/array as expected
    const actual = response.data;
    const expected = assertion.value;

    // This is a simplified implementation
    const passed = typeof actual === typeof expected;

    return {
      assertion,
      passed,
      message: passed
        ? assertion.description
        : `Schema validation failed`,
      actual: typeof actual,
      expected: typeof expected,
    };
  }

  private compare(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;

      case 'notEquals':
        return actual !== expected;

      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;

      case 'notContains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return !actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return !actual.includes(expected);
        }
        return true;

      case 'greaterThan':
        return actual > expected;

      case 'lessThan':
        return actual < expected;

      case 'exists':
        return actual !== undefined && actual !== null;

      case 'notExists':
        return actual === undefined || actual === null;

      case 'matches':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return new RegExp(expected).test(actual);
        }
        return false;

      default:
        return false;
    }
  }

  async executeCollection(tests: APITest[]): Promise<TestExecution[]> {
    const executions: TestExecution[] = [];

    for (const test of tests) {
      const execution = await this.executeTest(test);
      executions.push(execution);
    }

    return executions;
  }
}
