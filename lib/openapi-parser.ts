import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';
import type { ParsedEndpoint, APIInfo, Parameter, RequestBody, Response, MediaType } from '@/types';

export class OpenAPIParser {
  private spec: OpenAPIV3.Document | null = null;

  async parse(source: string | object): Promise<void> {
    try {
      // Parse and dereference the OpenAPI spec
      const api = await SwaggerParser.validate(source as any);

      // Ensure it's OpenAPI 3.x
      if (!('openapi' in api) || !api.openapi.startsWith('3.')) {
        throw new Error('Only OpenAPI 3.x specifications are supported');
      }

      this.spec = api as OpenAPIV3.Document;
    } catch (error) {
      throw new Error(`Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAPIInfo(): APIInfo {
    if (!this.spec) {
      throw new Error('No OpenAPI spec loaded');
    }

    const baseUrl = this.getBaseURL();

    return {
      title: this.spec.info.title,
      version: this.spec.info.version,
      description: this.spec.info.description,
      baseUrl,
    };
  }

  getEndpoints(): ParsedEndpoint[] {
    if (!this.spec || !this.spec.paths) {
      throw new Error('No OpenAPI spec loaded');
    }

    const endpoints: ParsedEndpoint[] = [];

    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      if (!pathItem) continue;

      const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

      for (const method of methods) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;

        if (!operation) continue;

        const endpoint: ParsedEndpoint = {
          path,
          method: method.toUpperCase() as ParsedEndpoint['method'],
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          parameters: this.parseParameters(operation.parameters),
          requestBody: this.parseRequestBody(operation.requestBody),
          responses: this.parseResponses(operation.responses),
          tags: operation.tags,
        };

        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  private parseParameters(parameters?: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]): Parameter[] | undefined {
    if (!parameters || parameters.length === 0) return undefined;

    return parameters
      .filter((param): param is OpenAPIV3.ParameterObject => !('$ref' in param))
      .map((param) => ({
        name: param.name,
        in: param.in as Parameter['in'],
        required: param.required || false,
        schema: param.schema,
        description: param.description,
      }));
  }

  private parseRequestBody(requestBody?: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject): RequestBody | undefined {
    if (!requestBody || '$ref' in requestBody) return undefined;

    const content: Record<string, MediaType> = {};

    for (const [mediaType, mediaTypeObj] of Object.entries(requestBody.content || {})) {
      content[mediaType] = {
        schema: mediaTypeObj.schema,
        example: mediaTypeObj.example,
        examples: mediaTypeObj.examples,
      };
    }

    return {
      required: requestBody.required || false,
      content,
    };
  }

  private parseResponses(responses?: OpenAPIV3.ResponsesObject): Record<string, Response> {
    if (!responses) return {};

    const parsedResponses: Record<string, Response> = {};

    for (const [statusCode, response] of Object.entries(responses)) {
      if ('$ref' in response) continue;

      const content: Record<string, MediaType> = {};

      if (response.content) {
        for (const [mediaType, mediaTypeObj] of Object.entries(response.content)) {
          content[mediaType] = {
            schema: mediaTypeObj.schema,
            example: mediaTypeObj.example,
            examples: mediaTypeObj.examples,
          };
        }
      }

      parsedResponses[statusCode] = {
        description: response.description,
        content: Object.keys(content).length > 0 ? content : undefined,
      };
    }

    return parsedResponses;
  }

  private getBaseURL(): string | undefined {
    if (!this.spec || !this.spec.servers || this.spec.servers.length === 0) {
      return undefined;
    }

    // Use the first server URL
    const firstServer = this.spec.servers[0];
    return firstServer.url;
  }
}

export async function parseOpenAPISpec(input: string | object): Promise<{
  endpoints: ParsedEndpoint[];
  apiInfo: APIInfo;
}> {
  const parser = new OpenAPIParser();
  await parser.parse(input);

  const endpoints = parser.getEndpoints();
  const apiInfo = parser.getAPIInfo();

  return { endpoints, apiInfo };
}
