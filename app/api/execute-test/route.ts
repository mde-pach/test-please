import { NextRequest, NextResponse } from 'next/server';
import { TestRunner } from '@/lib/test-runner';
import type { TestExecutionRequest, TestExecutionResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: TestExecutionRequest = await request.json();

    if (!body.test) {
      return NextResponse.json<TestExecutionResponse>(
        {
          success: false,
          error: 'Missing required field: test',
        },
        { status: 400 }
      );
    }

    const runner = new TestRunner();
    const execution = await runner.executeTest(body.test);

    return NextResponse.json<TestExecutionResponse>({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Error executing test:', error);

    return NextResponse.json<TestExecutionResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute test',
      },
      { status: 500 }
    );
  }
}
