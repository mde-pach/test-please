import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db/client';
import { projects, collections, tests, environments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getExampleOpenAPISpec } from '@/lib/example-openapi-spec';
import { generateBrunoTests } from '@/lib/ai-bruno-generator';
import type { ParsedEndpoint } from '@/types';
import type { OpenAPIV3 } from 'openapi-types';

const SHOWCASE_PROJECT_ID = 'showcase-todo-api';

/**
 * Check if showcase project exists
 */
export async function showcaseProjectExists(): Promise<boolean> {
  const db = await getDb();
  const existing = await db.select().from(projects).where(eq(projects.id, SHOWCASE_PROJECT_ID));
  return existing.length > 0;
}

/**
 * Create or get showcase project
 */
export async function getOrCreateShowcaseProject(): Promise<string> {
  const exists = await showcaseProjectExists();

  if (exists) {
    return SHOWCASE_PROJECT_ID;
  }

  return await createShowcaseProject();
}

/**
 * Create the showcase project with pre-generated tests
 */
async function createShowcaseProject(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const spec = getExampleOpenAPISpec(baseUrl);
  const db = await getDb();

  // Extract API info
  const apiInfo = {
    title: spec.info.title,
    version: spec.info.version,
    description: spec.info.description,
    baseUrl: spec.servers?.[0]?.url || baseUrl,
  };

  // Parse endpoints
  const endpoints = parseEndpoints(spec as any);

  // Create project
  await db.insert(projects).values({
    id: SHOWCASE_PROJECT_ID,
    name: 'Showcase: Todo API',
    description: 'Example project demonstrating the API Test Platform with a working Todo API. Use this to explore features and see how tests are organized.',
    apiInfo: {
      title: apiInfo.title,
      version: apiInfo.version,
      baseUrl: apiInfo.baseUrl,
    },
    spec: {
      source: 'url',
      content: JSON.stringify(spec),
      parsedAt: new Date().toISOString(),
    },
    metadata: {
      tags: ['example', 'showcase'],
      favorite: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create default environment
  const envId = uuidv4();
  await db.insert(environments).values({
    id: envId,
    projectId: SHOWCASE_PROJECT_ID,
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
    projectId: SHOWCASE_PROJECT_ID,
    name: `${apiInfo.title} Tests`,
    description: 'Comprehensive test suite for the Example Todo API',
    bruConfig: {
      version: '1',
      type: 'collection',
      name: apiInfo.title,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Generate tests for all endpoints
  let totalTestsGenerated = 0;

  for (const endpoint of endpoints) {
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

  console.log(`✅ Showcase project created with ${totalTestsGenerated} tests`);

  return SHOWCASE_PROJECT_ID;
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
