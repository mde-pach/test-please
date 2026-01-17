import { NextRequest, NextResponse } from 'next/server';
import { parseOpenAPISpec } from '@/lib/openapi-parser';
import type { OpenAPIInput, ParseOpenAPIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: OpenAPIInput = await request.json();

    if (!body.source || !body.content) {
      return NextResponse.json<ParseOpenAPIResponse>(
        {
          success: false,
          error: 'Missing required fields: source and content',
        },
        { status: 400 }
      );
    }

    let specContent: string | object;

    if (body.source === 'url') {
      // Fetch the OpenAPI spec from URL
      const response = await fetch(body.content);

      if (!response.ok) {
        return NextResponse.json<ParseOpenAPIResponse>(
          {
            success: false,
            error: `Failed to fetch OpenAPI spec from URL: ${response.statusText}`,
          },
          { status: 400 }
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        specContent = await response.json();
      } else {
        specContent = await response.text();
      }
    } else {
      // Parse the uploaded file content
      try {
        specContent = JSON.parse(body.content);
      } catch {
        // If it's not JSON, try to use it as YAML string
        specContent = body.content;
      }
    }

    // Parse the OpenAPI spec
    const { endpoints, apiInfo } = await parseOpenAPISpec(specContent);

    return NextResponse.json<ParseOpenAPIResponse>({
      success: true,
      endpoints,
      apiInfo,
    });
  } catch (error) {
    console.error('Error parsing OpenAPI spec:', error);

    return NextResponse.json<ParseOpenAPIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse OpenAPI specification',
      },
      { status: 500 }
    );
  }
}
