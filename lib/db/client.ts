import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const DB_PATH = process.env.DATABASE_PATH || './data/test-please.db';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection (singleton)
 */
export async function getDb() {
  if (db) return db;

  // Ensure data directory exists
  await mkdir(dirname(DB_PATH), { recursive: true });

  // Create SQLite connection
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
  sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints

  // Create Drizzle instance
  db = drizzle(sqlite, { schema });

  // Initialize database schema
  await initializeDatabase(sqlite);

  return db;
}

/**
 * Initialize database tables if they don't exist
 */
async function initializeDatabase(sqlite: Database.Database) {
  // Create projects table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      api_info TEXT NOT NULL,
      spec TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create collections table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      bru_config TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Create tests table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      test_type TEXT NOT NULL,
      bru_content TEXT NOT NULL,
      endpoint_path TEXT,
      method TEXT,
      tags TEXT,
      "order" INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    )
  `);

  // Create test_runs table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS test_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT,
      run_type TEXT NOT NULL,
      status TEXT NOT NULL,
      total_tests INTEGER NOT NULL DEFAULT 0,
      passed_tests INTEGER NOT NULL DEFAULT 0,
      failed_tests INTEGER NOT NULL DEFAULT 0,
      error_tests INTEGER NOT NULL DEFAULT 0,
      job_id TEXT,
      started_at TEXT,
      completed_at TEXT,
      duration REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Create test_executions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS test_executions (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      test_id TEXT NOT NULL,
      status TEXT NOT NULL,
      duration REAL NOT NULL,
      request TEXT NOT NULL,
      response TEXT,
      assertion_results TEXT,
      test_results TEXT,
      error TEXT,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    )
  `);

  // Create environments table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      variables TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_collections_project_id ON collections(project_id);
    CREATE INDEX IF NOT EXISTS idx_tests_collection_id ON tests(collection_id);
    CREATE INDEX IF NOT EXISTS idx_test_runs_project_id ON test_runs(project_id);
    CREATE INDEX IF NOT EXISTS idx_test_executions_run_id ON test_executions(run_id);
    CREATE INDEX IF NOT EXISTS idx_test_executions_test_id ON test_executions(test_id);
    CREATE INDEX IF NOT EXISTS idx_environments_project_id ON environments(project_id);
  `);

  console.log('✅ Database initialized successfully');
}

/**
 * Close database connection
 */
export function closeDb() {
  if (db) {
    // Drizzle doesn't expose close method, but we can access the underlying SQLite instance
    // This is primarily for cleanup during shutdown
    db = null;
  }
}
