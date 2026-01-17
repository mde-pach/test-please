import { NextRequest, NextResponse } from 'next/server';
import { generateTestFiles } from '@/lib/test-generator';
import type { GenerateTestsRequest, GenerateTestsResponse } from '@/types';

export const maxDuration = 300; // 5 minutes for test generation

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTestsRequest = await request.json();

    if (!body.endpoints || !body.apiInfo) {
      return NextResponse.json<GenerateTestsResponse>(
        {
          success: false,
          error: 'Missing required fields: endpoints and apiInfo',
        },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json<GenerateTestsResponse>(
        {
          success: false,
          error: 'ANTHROPIC_API_KEY environment variable is not set',
        },
        { status: 500 }
      );
    }

    // Generate test files for all endpoints
    const testFiles = await generateTestFiles(
      body.endpoints,
      body.apiInfo,
      body.options
    );

    if (testFiles.length === 0) {
      return NextResponse.json<GenerateTestsResponse>(
        {
          success: false,
          error: 'No test files were generated. Please check your OpenAPI specification.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json<GenerateTestsResponse>({
      success: true,
      testFiles,
    });
  } catch (error) {
    console.error('Error generating tests:', error);

    return NextResponse.json<GenerateTestsResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate test files',
      },
      { status: 500 }
    );
  }
}
