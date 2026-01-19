import type { VariableExtraction } from '@/types';
import type { AxiosResponse } from 'axios';

/**
 * Variable Manager for multi-step test execution
 * Handles extraction and substitution of variables between test steps
 */
export class VariableManager {
  private variables: Map<string, any> = new Map();

  /**
   * Extract variable from response based on extraction config
   */
  extractVariable(response: AxiosResponse, extraction: VariableExtraction): any {
    switch (extraction.source) {
      case 'header':
        return this.extractFromHeader(response, extraction);
      case 'body':
        return this.extractFromBody(response, extraction);
      case 'jsonPath':
        return this.extractFromJsonPath(response, extraction);
      default:
        throw new Error(`Unknown extraction source: ${extraction.source}`);
    }
  }

  /**
   * Extract from response header
   */
  private extractFromHeader(response: AxiosResponse, extraction: VariableExtraction): any {
    if (!extraction.headerName) {
      throw new Error('headerName is required for header extraction');
    }

    const headerValue = response.headers[extraction.headerName.toLowerCase()];
    if (headerValue === undefined) {
      throw new Error(`Header '${extraction.headerName}' not found in response`);
    }

    return headerValue;
  }

  /**
   * Extract from response body
   */
  private extractFromBody(response: AxiosResponse, extraction: VariableExtraction): any {
    return response.data;
  }

  /**
   * Extract from JSON response using JSONPath
   */
  private extractFromJsonPath(response: AxiosResponse, extraction: VariableExtraction): any {
    if (!extraction.path) {
      throw new Error('path is required for jsonPath extraction');
    }

    const data = response.data;
    const value = this.evaluateJsonPath(data, extraction.path);

    if (value === undefined) {
      throw new Error(`JSONPath '${extraction.path}' did not match any value`);
    }

    return value;
  }

  /**
   * Simple JSONPath evaluator
   * Supports: $.field, $.field.nested, $.array[0], $.field[0].nested
   */
  private evaluateJsonPath(data: any, path: string): any {
    // Remove leading $. or $
    let cleanPath = path.replace(/^\$\.?/, '');

    if (!cleanPath) {
      return data;
    }

    // Split by . but handle array indices
    const parts = cleanPath.split(/\.(?![^\[]*\])/);
    let current = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array index: field[0] or [0]
      const arrayMatch = part.match(/^([^\[]*)\[(\d+)\]$/);
      if (arrayMatch) {
        const fieldName = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);

        if (fieldName) {
          // field[index]
          current = current[fieldName];
          if (current === undefined) return undefined;
        }

        // Get array element
        if (!Array.isArray(current)) {
          return undefined;
        }
        current = current[index];
      } else {
        // Regular field access
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Store extracted variable
   */
  setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }

  /**
   * Get variable value
   */
  getVariable(name: string): any {
    return this.variables.get(name);
  }

  /**
   * Check if variable exists
   */
  hasVariable(name: string): boolean {
    return this.variables.has(name);
  }

  /**
   * Get all variables
   */
  getAllVariables(): Record<string, any> {
    return Object.fromEntries(this.variables.entries());
  }

  /**
   * Substitute variables in a string using {{variableName}} syntax
   */
  substituteString(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      if (!this.hasVariable(varName)) {
        throw new Error(`Variable '${varName}' not found. Available: ${Array.from(this.variables.keys()).join(', ')}`);
      }
      return String(this.getVariable(varName));
    });
  }

  /**
   * Substitute variables in an object (deep)
   */
  substituteObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.substituteString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteObject(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Clear all variables
   */
  clear(): void {
    this.variables.clear();
  }
}
