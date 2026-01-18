import { NextRequest, NextResponse } from 'next/server';
import { getExampleOpenAPISpec } from '@/lib/example-openapi-spec';

/**
 * GET /api/example/openapi.json
 * Serves the OpenAPI 3.0 specification for the example Todo API
 */
export async function GET(request: NextRequest) {
  try {
    // Get dynamic base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Generate spec with dynamic base URL
    const spec = getExampleOpenAPISpec(baseUrl);

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate OpenAPI specification',
      },
      { status: 500 }
    );
  }
}
