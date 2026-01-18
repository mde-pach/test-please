import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios';
import type { APITest, TestStep, TestExecution, AssertionResult, Assertion } from '@/types';
import { VariableManager } from './variable-manager';

/**
 * Story Test Runner - Executes multi-step test scenarios
 * Handles variable extraction and substitution between steps
 */
export class StoryTestRunner {
  private variableManager: VariableManager;

  constructor() {
    this.variableManager = new VariableManager();
  }

  /**
   * Execute a story test (multi-step test)
   */
  async executeStoryTest(test: APITest): Promise<TestExecution> {
    if (!test.steps || test.steps.length === 0) {
      throw new Error('Story test must have steps');
    }

    const startTime = Date.now();
    const stepExecutions: StepExecution[] = [];
    let overallStatus: 'passed' | 'failed' | 'error' = 'passed';
    let errorMessage: string | undefined;

    // Clear variables for fresh start
    this.variableManager.clear();

    // Sort steps by order
    const sortedSteps = [...test.steps].sort((a, b) => a.order - b.order);

    // Execute each step in sequence
    for (const step of sortedSteps) {
      try {
        const stepExecution = await this.executeStep(step);
        stepExecutions.push(stepExecution);

        // Extract variables if configured
        if (step.extractVariables && stepExecution.response) {
          for (const extraction of step.extractVariables) {
            try {
              const value = this.variableManager.extractVariable(stepExecution.response, extraction);
              this.variableManager.setVariable(extraction.name, value);
            } catch (error) {
              console.error(`Failed to extract variable '${extraction.name}':`, error);
              overallStatus = 'error';
              errorMessage = `Variable extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
              break;
            }
          }
        }

        // If step failed or errored, stop execution
        if (stepExecution.status !== 'passed') {
          overallStatus = stepExecution.status;
          errorMessage = stepExecution.error;
          break;
        }
      } catch (error) {
        overallStatus = 'error';
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        break;
      }
    }

    const duration = Date.now() - startTime;

    // Build combined execution result
    return {
      testId: test.id,
      executedAt: new Date().toISOString(),
      status: overallStatus,
      duration,
      request: {
        method: test.request.method,
        url: test.request.url,
        headers: test.request.headers,
        body: test.request.body?.data,
      },
      response: stepExecutions[stepExecutions.length - 1]?.response
        ? {
            status: stepExecutions[stepExecutions.length - 1].response!.status,
            statusText: stepExecutions[stepExecutions.length - 1].response!.statusText,
            headers: stepExecutions[stepExecutions.length - 1].response!.headers as Record<string, string>,
            body: stepExecutions[stepExecutions.length - 1].response!.data,
            time: duration,
          }
        : undefined,
      assertionResults: this.combineAssertionResults(stepExecutions),
      error: errorMessage,
      // Add step-by-step results for visibility
      stepResults: stepExecutions.map(se => ({
        stepId: se.stepId,
        stepName: se.stepName,
        status: se.status,
        duration: se.duration,
        extractedVariables: se.extractedVariables,
      })),
    } as TestExecution & { stepResults: any[] };
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: TestStep): Promise<StepExecution> {
    const startTime = Date.now();

    try {
      // Substitute variables in request
      const request = this.prepareStepRequest(step);

      // Execute HTTP request
      const response = await axios(request);
      const duration = Date.now() - startTime;

      // Validate assertions
      const assertionResults = step.assertions.map(assertion =>
        this.validateAssertion(assertion, response, duration)
      );

      const allPassed = assertionResults.every(r => r.passed);

      return {
        stepId: step.id,
        stepName: step.name,
        status: allPassed ? 'passed' : 'failed',
        duration,
        request,
        response,
        assertionResults,
        extractedVariables: this.variableManager.getAllVariables(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error) && error.response) {
        // HTTP error with response
        const assertionResults = step.assertions.map(assertion =>
          this.validateAssertion(assertion, error.response!, duration)
        );

        return {
          stepId: step.id,
          stepName: step.name,
          status: 'failed',
          duration,
          request: this.prepareStepRequest(step),
          response: error.response,
          assertionResults,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`,
          extractedVariables: this.variableManager.getAllVariables(),
        };
      } else {
        // Network or other error
        return {
          stepId: step.id,
          stepName: step.name,
          status: 'error',
          duration,
          request: this.prepareStepRequest(step),
          assertionResults: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          extractedVariables: this.variableManager.getAllVariables(),
        };
      }
    }
  }

  /**
   * Prepare step request with variable substitution
   */
  private prepareStepRequest(step: TestStep): AxiosRequestConfig {
    // Substitute variables in URL
    const url = this.variableManager.substituteString(step.request.url);

    // Substitute variables in headers
    const headers = step.request.headers
      ? this.variableManager.substituteObject(step.request.headers)
      : {};

    // Substitute variables in query params
    const params = step.request.queryParams
      ? this.variableManager.substituteObject(step.request.queryParams)
      : undefined;

    // Substitute variables in body
    let data = undefined;
    if (step.request.body && step.request.body.type !== 'none' && step.request.body.data) {
      data = this.variableManager.substituteObject(step.request.body.data);
    }

    return {
      method: step.request.method,
      url,
      headers,
      params,
      data,
      validateStatus: () => true, // Don't throw on any status code
    };
  }

  /**
   * Validate assertion against response
   */
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
        case 'jsonPath':
          return this.validateJsonPathAssertion(assertion, response);
        case 'body':
          return this.validateBodyAssertion(assertion, response);
        case 'responseTime':
          return this.validateResponseTimeAssertion(assertion, duration);
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
        message: error instanceof Error ? error.message : 'Assertion validation failed',
      };
    }
  }

  private validateStatusAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    const actual = response.status;
    const expected = assertion.value;
    const passed = this.compareValues(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed
        ? `Status ${actual} matches expectation`
        : `Expected status ${expected}, got ${actual}`,
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
        message: passed ? `Header '${assertion.field}' exists` : `Header '${assertion.field}' not found`,
        actual,
      };
    }

    if (assertion.operator === 'notExists') {
      const passed = actual === undefined;
      return {
        assertion,
        passed,
        message: passed ? `Header '${assertion.field}' does not exist` : `Header '${assertion.field}' exists`,
        actual,
      };
    }

    const passed = this.compareValues(actual, expected, assertion.operator);
    return {
      assertion,
      passed,
      message: passed ? 'Header value matches' : `Expected '${expected}', got '${actual}'`,
      actual,
      expected,
    };
  }

  private validateJsonPathAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    if (!assertion.field) {
      return {
        assertion,
        passed: false,
        message: 'JSONPath not specified',
      };
    }

    const actual = this.variableManager['evaluateJsonPath'](response.data, assertion.field);

    if (assertion.operator === 'exists') {
      const passed = actual !== undefined;
      return {
        assertion,
        passed,
        message: passed ? `Field '${assertion.field}' exists` : `Field '${assertion.field}' not found`,
        actual,
      };
    }

    if (assertion.operator === 'notExists') {
      const passed = actual === undefined;
      return {
        assertion,
        passed,
        message: passed ? `Field '${assertion.field}' does not exist` : `Field '${assertion.field}' exists`,
        actual,
      };
    }

    const expected = assertion.value;
    const passed = this.compareValues(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed ? 'JSONPath value matches' : `Expected '${JSON.stringify(expected)}', got '${JSON.stringify(actual)}'`,
      actual,
      expected,
    };
  }

  private validateBodyAssertion(assertion: Assertion, response: AxiosResponse): AssertionResult {
    const actual = JSON.stringify(response.data);
    const expected = JSON.stringify(assertion.value);
    const passed = this.compareValues(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed ? 'Body matches' : 'Body does not match',
      actual: response.data,
      expected: assertion.value,
    };
  }

  private validateResponseTimeAssertion(assertion: Assertion, duration: number): AssertionResult {
    const actual = duration;
    const expected = assertion.value;
    const passed = this.compareValues(actual, expected, assertion.operator);

    return {
      assertion,
      passed,
      message: passed
        ? `Response time ${actual}ms is acceptable`
        : `Expected response time ${assertion.operator} ${expected}ms, got ${actual}ms`,
      actual,
      expected,
    };
  }

  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
      case 'notEquals':
        return actual !== expected && JSON.stringify(actual) !== JSON.stringify(expected);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'notContains':
        return !String(actual).includes(String(expected));
      case 'greaterThan':
        return Number(actual) > Number(expected);
      case 'lessThan':
        return Number(actual) < Number(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'notExists':
        return actual === undefined || actual === null;
      case 'matches':
        return new RegExp(expected).test(String(actual));
      default:
        return false;
    }
  }

  private combineAssertionResults(stepExecutions: StepExecution[]): AssertionResult[] {
    const results: AssertionResult[] = [];

    stepExecutions.forEach((se, index) => {
      se.assertionResults.forEach(ar => {
        // Prefix assertion description with step info
        const enhancedAssertion = {
          ...ar.assertion,
          description: `Step ${index + 1} (${se.stepName}): ${ar.assertion.description}`,
        };
        results.push({
          ...ar,
          assertion: enhancedAssertion,
        });
      });
    });

    return results;
  }
}

interface StepExecution {
  stepId: string;
  stepName: string;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  request: AxiosRequestConfig;
  response?: AxiosResponse;
  assertionResults: AssertionResult[];
  error?: string;
  extractedVariables: Record<string, any>;
}
