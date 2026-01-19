import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq';

/**
 * Redis connection configuration
 */
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
};

/**
 * Queue names
 */
export const QUEUE_NAMES = {
  TEST_EXECUTION: 'test-execution',
} as const;

/**
 * Job data types
 */
export interface TestExecutionJobData {
  runId: string;
  projectId: string;
  testIds: string[];
  environmentId?: string;
}

/**
 * Job result types
 */
export interface TestExecutionJobResult {
  runId: string;
  status: 'completed' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  duration: number;
}

/**
 * Queue singleton instances
 */
let testExecutionQueue: Queue<TestExecutionJobData, TestExecutionJobResult> | null = null;
let testExecutionWorker: Worker<TestExecutionJobData, TestExecutionJobResult> | null = null;
let testExecutionEvents: QueueEvents | null = null;

/**
 * Get or create test execution queue
 */
export function getTestExecutionQueue() {
  if (!testExecutionQueue) {
    testExecutionQueue = new Queue<TestExecutionJobData, TestExecutionJobResult>(
      QUEUE_NAMES.TEST_EXECUTION,
      {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
            age: 24 * 60 * 60, // Remove after 24 hours
          },
          removeOnFail: {
            count: 200, // Keep last 200 failed jobs
            age: 7 * 24 * 60 * 60, // Remove after 7 days
          },
        },
      }
    );
  }
  return testExecutionQueue;
}

/**
 * Get or create queue events listener
 */
export function getTestExecutionEvents() {
  if (!testExecutionEvents) {
    testExecutionEvents = new QueueEvents(QUEUE_NAMES.TEST_EXECUTION, {
      connection: redisConnection,
    });
  }
  return testExecutionEvents;
}

/**
 * Set worker instance (created in worker file)
 */
export function setTestExecutionWorker(worker: Worker<TestExecutionJobData, TestExecutionJobResult>) {
  testExecutionWorker = worker;
}

/**
 * Get worker instance
 */
export function getTestExecutionWorker() {
  return testExecutionWorker;
}

/**
 * Close all queue connections
 */
export async function closeQueues() {
  const closePromises: Promise<void>[] = [];

  if (testExecutionQueue) {
    closePromises.push(testExecutionQueue.close());
    testExecutionQueue = null;
  }

  if (testExecutionWorker) {
    closePromises.push(testExecutionWorker.close());
    testExecutionWorker = null;
  }

  if (testExecutionEvents) {
    closePromises.push(testExecutionEvents.close());
    testExecutionEvents = null;
  }

  await Promise.all(closePromises);
  console.log('✅ All queues closed');
}
