import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import { getDb } from '@/lib/db/client';
import { projects, collections, tests, environments } from '@/lib/db/schema';
import { generateBrunoTests } from '@/lib/ai-bruno-generator';
import type { ParsedEndpoint } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec, projectName, projectDescription } = body;

    if (!spec) {
      return NextResponse.json(
        { success: false, error: 'OpenAPI spec is required' },
        { status: 400 }
      );
    }

    // Parse OpenAPI spec
    let parsedSpec: OpenAPIV3.Document;
    try {
      parsedSpec = await SwaggerParser.validate(JSON.parse(spec)) as OpenAPIV3.Document;
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `Invalid OpenAPI spec: ${error.message}` },
        { status: 400 }
      );
    }

    // Extract API info
    const apiInfo = {
      title: parsedSpec.info.title,
      version: parsedSpec.info.version,
      description: parsedSpec.info.description,
      baseUrl: getBaseUrl(parsedSpec),
    };

    // Parse endpoints
    const endpoints = parseEndpoints(parsedSpec);

    if (endpoints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No endpoints found in OpenAPI spec' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Create project
    const projectId = uuidv4();
    await db.insert(projects).values({
      id: projectId,
      name: projectName || apiInfo.title,
      description: projectDescription || apiInfo.description,
      apiInfo: {
        title: apiInfo.title,
        version: apiInfo.version,
        baseUrl: apiInfo.baseUrl,
      },
      spec: {
        source: 'upload',
        content: spec,
        parsedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create default environment
    const envId = uuidv4();
    await db.insert(environments).values({
      id: envId,
      projectId,
      name: 'default',
      variables: {
        baseUrl: apiInfo.baseUrl,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create collection
    const collectionId = uuidv4();
    await db.insert(collections).values({
      id: collectionId,
      projectId,
      name: `${apiInfo.title} Tests`,
      description: 'Auto-generated tests from OpenAPI specification',
      bruConfig: {
        version: '1',
        type: 'collection',
        name: apiInfo.title,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Generate tests for each endpoint (limit to first 5 for demo)
    const endpointsToProcess = endpoints.slice(0, 5);
    let totalTestsGenerated = 0;

    for (const endpoint of endpointsToProcess) {
      try {
        const brunoTests = await generateBrunoTests(endpoint, apiInfo, endpoints);

        // Save tests to database
        for (const [index, test] of brunoTests.entries()) {
          await db.insert(tests).values({
            id: test.id,
            collectionId,
            name: test.name,
            description: test.description,
            category: test.category,
            testType: test.testType,
            bruContent: test.bruContent,
            endpointPath: test.endpointPath,
            method: test.method,
            tags: test.tags,
            order: totalTestsGenerated + index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        totalTestsGenerated += brunoTests.length;

      } catch (error) {
        console.error(`Failed to generate tests for ${endpoint.method} ${endpoint.path}:`, error);
        // Continue with next endpoint
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      collectionId,
      testsGenerated: totalTestsGenerated,
      endpointsProcessed: endpointsToProcess.length,
      message: `Project created successfully with ${totalTestsGenerated} tests`,
    });

  } catch (error: any) {
    console.error('Error generating project:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate project' },
      { status: 500 }
    );
  }
}

/**
 * Get base URL from OpenAPI spec
 */
function getBaseUrl(spec: OpenAPIV3.Document): string {
  if (spec.servers && spec.servers.length > 0) {
    return spec.servers[0].url;
  }
  return 'https://api.example.com';
}

/**
 * Parse endpoints from OpenAPI spec
 */
function parseEndpoints(spec: OpenAPIV3.Document): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      endpoints.push({
        path,
        method: method.toUpperCase() as any,
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        parameters: operation.parameters as any,
        requestBody: operation.requestBody as any,
        responses: operation.responses as any,
        tags: operation.tags,
      });
    }
  }

  return endpoints;
}
