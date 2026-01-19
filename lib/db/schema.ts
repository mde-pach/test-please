import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Projects table - Top-level container for API testing projects
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  apiInfo: text('api_info', { mode: 'json' }).notNull().$type<{
    title: string;
    version: string;
    baseUrl: string;
  }>(),
  spec: text('spec', { mode: 'json' }).$type<{
    source: 'upload' | 'url';
    content: string;
    parsedAt: string;
  }>(),
  metadata: text('metadata', { mode: 'json' }).$type<{
    tags?: string[];
    favorite?: boolean;
    customHeaders?: Record<string, string>;
  }>(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Collections table - Groups of related tests (Bruno collections)
 */
export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  bruConfig: text('bru_config', { mode: 'json' }).$type<{
    version: string;
    type: 'collection';
    name: string;
  }>(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Tests table - Individual test definitions stored as .bru content
 */
export const tests = sqliteTable('tests', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // 'contract' | 'story'
  testType: text('test_type').notNull(), // 'success' | 'error' | 'validation' | 'edge-case'
  bruContent: text('bru_content').notNull(), // Complete .bru file content
  endpointPath: text('endpoint_path'), // e.g., '/api/users'
  method: text('method'), // HTTP method
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  order: integer('order').default(0), // Display order within collection
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Test Runs table - Execution sessions tracking multiple tests
 */
export const testRuns = sqliteTable('test_runs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name'), // Optional run name
  runType: text('run_type').notNull(), // 'collection' | 'selection' | 'search' | 'single'
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  totalTests: integer('total_tests').notNull().default(0),
  passedTests: integer('passed_tests').notNull().default(0),
  failedTests: integer('failed_tests').notNull().default(0),
  errorTests: integer('error_tests').notNull().default(0),
  jobId: text('job_id'), // BullMQ job ID
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  duration: real('duration'), // in milliseconds
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Test Executions table - Individual test results within a run
 */
export const testExecutions = sqliteTable('test_executions', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => testRuns.id, { onDelete: 'cascade' }),
  testId: text('test_id').notNull().references(() => tests.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'passed' | 'failed' | 'error'
  duration: real('duration').notNull(), // in milliseconds
  request: text('request', { mode: 'json' }).notNull().$type<{
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  }>(),
  response: text('response', { mode: 'json' }).$type<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
  }>(),
  assertionResults: text('assertion_results', { mode: 'json' }).$type<Array<{
    type: string;
    passed: boolean;
    message: string;
    expected?: any;
    actual?: any;
  }>>(),
  testResults: text('test_results', { mode: 'json' }).$type<Array<{
    name: string;
    status: 'pass' | 'fail';
    error?: string;
  }>>(),
  error: text('error'),
  executedAt: text('executed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Environments table - Environment variables for collections
 */
export const environments = sqliteTable('environments', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // 'dev', 'staging', 'production'
  variables: text('variables', { mode: 'json' }).notNull().$type<Record<string, string>>(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Test = typeof tests.$inferSelect;
export type NewTest = typeof tests.$inferInsert;
export type TestRun = typeof testRuns.$inferSelect;
export type NewTestRun = typeof testRuns.$inferInsert;
export type TestExecution = typeof testExecutions.$inferSelect;
export type NewTestExecution = typeof testExecutions.$inferInsert;
export type Environment = typeof environments.$inferSelect;
export type NewEnvironment = typeof environments.$inferInsert;
