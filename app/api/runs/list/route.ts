import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { testRuns } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get all runs for the project, ordered by creation date (newest first)
    const runs = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.projectId, projectId))
      .orderBy(desc(testRuns.createdAt))
      .limit(100); // Limit to last 100 runs

    return NextResponse.json({
      success: true,
      runs: runs.map(run => ({
        id: run.id,
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
      })),
    });

  } catch (error: any) {
    console.error('Error listing test runs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list test runs' },
      { status: 500 }
    );
  }
}
