import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { testRuns, testExecutions, tests } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runId = params.id;

    const db = await getDb();

    // Get run details
    const [run] = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, runId))
      .limit(1);

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Test run not found' },
        { status: 404 }
      );
    }

    // Get execution results
    const executions = await db
      .select({
        execution: testExecutions,
        test: tests,
      })
      .from(testExecutions)
      .leftJoin(tests, eq(testExecutions.testId, tests.id))
      .where(eq(testExecutions.runId, runId));

    // Format results
    const executionResults = executions.map(({ execution, test }) => ({
      id: execution.id,
      testId: execution.testId,
      testName: test?.name || 'Unknown',
      status: execution.status,
      duration: execution.duration,
      request: execution.request,
      response: execution.response,
      testResults: execution.testResults,
      assertionResults: execution.assertionResults,
      error: execution.error,
      executedAt: execution.executedAt,
    }));

    return NextResponse.json({
      success: true,
      run: {
        id: run.id,
        projectId: run.projectId,
        name: run.name,
        runType: run.runType,
        status: run.status,
        totalTests: run.totalTests,
        passedTests: run.passedTests,
        failedTests: run.failedTests,
        errorTests: run.errorTests,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        duration: run.duration,
        createdAt: run.createdAt,
      },
      executions: executionResults,
    });

  } catch (error: any) {
    console.error('Error fetching test run:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test run' },
      { status: 500 }
    );
  }
}
