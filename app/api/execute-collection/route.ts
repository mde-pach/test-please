import { NextRequest, NextResponse } from 'next/server';
import { TestRunner } from '@/lib/test-runner';
import type { CollectionExecutionRequest, CollectionExecutionResponse } from '@/types';

export const maxDuration = 300; // 5 minutes for collection execution

export async function POST(request: NextRequest) {
  try {
    const body: CollectionExecutionRequest = await request.json();

    if (!body.tests || !Array.isArray(body.tests)) {
      return NextResponse.json<CollectionExecutionResponse>(
        {
          success: false,
          executions: [],
          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 0,
            duration: 0,
          },
          error: 'Missing or invalid field: tests',
        },
        { status: 400 }
      );
    }

    const runner = new TestRunner();
    const startTime = Date.now();
    const executions = await runner.executeCollection(body.tests);
    const totalDuration = Date.now() - startTime;

    // Calculate summary
    const summary = {
      total: executions.length,
      passed: executions.filter(e => e.status === 'passed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      errors: executions.filter(e => e.status === 'error').length,
      duration: totalDuration,
    };

    return NextResponse.json<CollectionExecutionResponse>({
      success: true,
      executions,
      summary,
    });
  } catch (error) {
    console.error('Error executing collection:', error);

    return NextResponse.json<CollectionExecutionResponse>(
      {
        success: false,
        executions: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          errors: 0,
          duration: 0,
        },
        error: error instanceof Error ? error.message : 'Failed to execute test collection',
      },
      { status: 500 }
    );
  }
}
