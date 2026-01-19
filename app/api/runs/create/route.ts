import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db/client';
import { testRuns } from '@/lib/db/schema';
import { getTestExecutionQueue } from '@/lib/queue/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, testIds, runType, name, environmentId } = body;

    // Validation
    if (!projectId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: projectId and testIds are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Create test run record
    const runId = uuidv4();
    await db.insert(testRuns).values({
      id: runId,
      projectId,
      name: name || `Test Run - ${new Date().toLocaleString()}`,
      runType: runType || 'selection',
      status: 'pending',
      totalTests: testIds.length,
      passedTests: 0,
      failedTests: 0,
      errorTests: 0,
      createdAt: new Date().toISOString(),
    });

    // Add job to queue
    const queue = getTestExecutionQueue();
    const job = await queue.add('execute-tests', {
      runId,
      projectId,
      testIds,
      environmentId,
    });

    // Update run with job ID
    await db
      .update(testRuns)
      .set({ jobId: job.id })
      .where({ id: runId } as any);

    return NextResponse.json({
      success: true,
      runId,
      jobId: job.id,
      message: 'Test run created and queued for execution',
    });

  } catch (error: any) {
    console.error('Error creating test run:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test run' },
      { status: 500 }
    );
  }
}
