#!/usr/bin/env node

/**
 * Background worker for processing test execution jobs
 *
 * This worker should be run separately from the Next.js app:
 * npm run worker
 *
 * Or in production:
 * node --loader ts-node/esm worker.ts
 */

import { createTestExecutionWorker, shutdownWorker } from './lib/queue/worker';
import { getDb } from './lib/db/client';

async function startWorker() {
  console.log('🚀 Starting test execution worker...');

  try {
    // Initialize database
    await getDb();
    console.log('✅ Database initialized');

    // Create and start worker
    const worker = createTestExecutionWorker();
    console.log('✅ Worker started and listening for jobs');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('📥 Received SIGTERM, shutting down gracefully...');
      await shutdownWorker();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📥 Received SIGINT, shutting down gracefully...');
      await shutdownWorker();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
