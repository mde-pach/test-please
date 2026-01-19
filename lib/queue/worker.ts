import { Worker, Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import {
  redisConnection,
  QUEUE_NAMES,
  TestExecutionJobData,
  TestExecutionJobResult,
  setTestExecutionWorker,
} from './config';
import { getDb } from '../db/client';
import { tests, testRuns, testExecutions, environments } from '../db/schema';
import { executeBruTest, VariableContext } from '../bruno/executor';

/**
 * Process a test execution job
 */
async function processTestExecutionJob(
  job: Job<TestExecutionJobData, TestExecutionJobResult>
): Promise<TestExecutionJobResult> {
  const { runId, projectId, testIds, environmentId } = job.data;

  console.log(`[Worker] Processing test execution job for run ${runId}`);

  const db = await getDb();
  const startTime = Date.now();

  try {
    // Update run status to running
    await db
      .update(testRuns)
      .set({
        status: 'running',
        startedAt: new Date().toISOString(),
      })
      .where(eq(testRuns.id, runId));

    // Load environment variables if specified
    let envVars: VariableContext = {};
    if (environmentId) {
      const [environment] = await db
        .select()
        .from(environments)
        .where(eq(environments.id, environmentId))
        .limit(1);

      if (environment) {
        envVars = environment.variables as VariableContext;
      }
    }

    // Load tests to execute
    const testsToRun = await db
      .select()
      .from(tests)
      .where(eq(tests.id, testIds[0])); // This is a simplified query

    // Better query for multiple test IDs
    const testsList = await db.select().from(tests);
    const filteredTests = testsList.filter(t => testIds.includes(t.id));

    let passedCount = 0;
    let failedCount = 0;
    let errorCount = 0;

    // Execute tests sequentially (could be parallelized later)
    for (const test of filteredTests) {
      await job.updateProgress({
        current: passedCount + failedCount + errorCount + 1,
        total: testIds.length,
      });

      try {
        // Execute test using Bruno executor
        const executionResult = await executeBruTest(
          test.bruContent,
          { ...envVars }, // Clone to prevent cross-test contamination
          envVars.baseUrl as string | undefined
        );

        // Save execution result to database
        const executionId = uuidv4();
        await db.insert(testExecutions).values({
          id: executionId,
          runId,
          testId: test.id,
          status: executionResult.status,
          duration: executionResult.duration,
          request: executionResult.request as any,
          response: executionResult.response as any,
          testResults: executionResult.testResults as any,
          assertionResults: executionResult.assertionResults as any,
          error: executionResult.error,
          executedAt: new Date().toISOString(),
        });

        // Update counters
        if (executionResult.status === 'passed') {
          passedCount++;
        } else if (executionResult.status === 'failed') {
          failedCount++;
        } else {
          errorCount++;
        }

      } catch (error: any) {
        console.error(`[Worker] Error executing test ${test.id}:`, error);

        // Save error execution
        const executionId = uuidv4();
        await db.insert(testExecutions).values({
          id: executionId,
          runId,
          testId: test.id,
          status: 'error',
          duration: 0,
          request: { method: 'UNKNOWN', url: 'UNKNOWN' } as any,
          testResults: [] as any,
          assertionResults: [] as any,
          error: error.message,
          executedAt: new Date().toISOString(),
        });

        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Update run with final results
    await db
      .update(testRuns)
      .set({
        status: 'completed',
        passedTests: passedCount,
        failedTests: failedCount,
        errorTests: errorCount,
        completedAt: new Date().toISOString(),
        duration,
      })
      .where(eq(testRuns.id, runId));

    console.log(`[Worker] Completed test run ${runId}: ${passedCount} passed, ${failedCount} failed, ${errorCount} errors`);

    return {
      runId,
      status: 'completed',
      totalTests: testIds.length,
      passedTests: passedCount,
      failedTests: failedCount,
      errorTests: errorCount,
      duration,
    };

  } catch (error: any) {
    console.error(`[Worker] Fatal error in test run ${runId}:`, error);

    // Update run status to failed
    await db
      .update(testRuns)
      .set({
        status: 'failed',
        completedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      })
      .where(eq(testRuns.id, runId));

    throw error;
  }
}

/**
 * Create and start the test execution worker
 */
export function createTestExecutionWorker() {
  const worker = new Worker<TestExecutionJobData, TestExecutionJobResult>(
    QUEUE_NAMES.TEST_EXECUTION,
    processTestExecutionJob,
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 test runs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per second
      },
    }
  );

  // Event listeners
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  // Store worker instance
  setTestExecutionWorker(worker);

  console.log('✅ Test execution worker started');

  return worker;
}

/**
 * Graceful shutdown
 */
export async function shutdownWorker() {
  const worker = await import('./config').then(m => m.getTestExecutionWorker());
  if (worker) {
    await worker.close();
    console.log('✅ Worker shut down gracefully');
  }
}
