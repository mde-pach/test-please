# Bruno-Based Testing Migration Guide

## 🎯 Overview

This project has been migrated from a custom testing implementation to a **Bruno-powered testing platform** with:

- ✅ **Bruno .bru file format** for test definitions
- ✅ **SQLite database** for persistence (instead of localStorage)
- ✅ **BullMQ + Redis** for background test execution
- ✅ **Pre-request scripts** for test setup/teardown
- ✅ **AI-powered test generation** with enhanced Bruno format
- ⏳ **Dark theme dashboard UI** (in progress)
- ⏳ **Flexible execution modes** (collection, selection, search)

## 🏗️ Architecture

### Database Schema

```
projects
├── collections
│   └── tests (stores .bru file content)
├── environments (variables)
└── test_runs
    └── test_executions
```

### Background Job Processing

```
API Request → Queue Job → Worker → Execute Tests → Store Results → Database
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `/lib/db/` | Database schema and client |
| `/lib/bruno/` | .bru file generator and executor |
| `/lib/queue/` | BullMQ configuration and worker |
| `/lib/ai-bruno-generator.ts` | AI test generation in Bruno format |
| `/app/api/projects/` | Project management APIs |
| `/app/api/runs/` | Test execution APIs |
| `worker.ts` | Background worker process |

## 📦 Setup Instructions

### Prerequisites

1. **Node.js 18+**
2. **Redis server** (for BullMQ)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start Redis (if not running)
redis-server

# 3. Set up environment variables (optional)
cat > .env.local << EOF
# Database
DATABASE_PATH=./data/test-please.db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Anthropic API (for AI test generation)
ANTHROPIC_API_KEY=your-key-here
EOF
```

### Running the Application

You need to run **TWO processes**:

**Terminal 1 - Next.js App:**
```bash
npm run dev
```

**Terminal 2 - Background Worker:**
```bash
npm run worker
```

### Development Tools

```bash
# View database schema in Drizzle Studio
npm run db:studio

# Push schema changes to database
npm run db:push
```

## 🔄 API Changes

### Old API (localStorage-based)
```typescript
POST /api/generate-tests
POST /api/execute-test (synchronous)
POST /api/execute-collection (synchronous)
```

### New API (database + background jobs)

**Project Management:**
```typescript
POST   /api/projects/generate    # Create project from OpenAPI spec
GET    /api/projects/list        # List all projects
GET    /api/projects/[id]        # Get project with tests
DELETE /api/projects/[id]        # Delete project
```

**Test Execution:**
```typescript
POST   /api/runs/create          # Queue test execution (async)
GET    /api/runs/[id]            # Get run status and results
GET    /api/runs/list?projectId=X # List runs for project
```

## 🧪 Bruno Test Format

### Example .bru File

```bruno
meta {
  name: should create user successfully
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/users
  body: json
  auth: none
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "name": "Test User {{timestamp}}",
    "email": "test{{timestamp}}@example.com"
  }
}

script:pre-request {
  // Set up test data
  bru.setVar("timestamp", Date.now());

  // For tests that need existing data:
  // - Query if test user exists
  // - Create if not exists
}

script:post-response {
  // Extract variables for next tests
  const body = res.getBody();
  if (body.id) {
    bru.setVar("userId", body.id);
  }
}

tests {
  test("Status code is 201", function() {
    expect(res.getStatus()).to.equal(201);
  });

  test("Response contains user ID", function() {
    const body = res.getBody();
    expect(body.id).to.exist;
  });

  test("Email matches request", function() {
    const body = res.getBody();
    expect(body.email).to.include("test");
  });
}
```

### Key Features

1. **Pre-request Scripts**: Set up test data, create dependencies
2. **Post-response Scripts**: Extract variables for subsequent tests
3. **Chai Assertions**: Full Chai.js expect() syntax
4. **Variable Substitution**: `{{variableName}}` in URL, headers, body
5. **Environment Variables**: Base URL, auth tokens, etc.

## 🚀 Test Execution Flow

### Creating and Running Tests

```typescript
// 1. Generate project from OpenAPI spec
const response = await fetch('/api/projects/generate', {
  method: 'POST',
  body: JSON.stringify({
    spec: openapiSpecJson,
    projectName: 'My API',
  }),
});

const { projectId, collectionId } = await response.json();

// 2. Queue test execution (runs in background)
const runResponse = await fetch('/api/runs/create', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    testIds: ['test-1', 'test-2', 'test-3'],
    runType: 'selection',
    environmentId: 'env-id',
  }),
});

const { runId, jobId } = await runResponse.json();

// 3. Poll for results
const resultsResponse = await fetch(`/api/runs/${runId}`);
const { run, executions } = await resultsResponse.json();

// run.status: 'pending' | 'running' | 'completed' | 'failed'
// run.passedTests, run.failedTests, run.errorTests
// executions: Array of detailed test results
```

## 📊 Database Structure

### Projects Table
```sql
id, name, description, api_info (JSON), spec (JSON), metadata (JSON)
```

### Collections Table
```sql
id, project_id, name, description, bru_config (JSON)
```

### Tests Table
```sql
id, collection_id, name, category, test_type,
bru_content (TEXT),  -- Complete .bru file
endpoint_path, method, tags (JSON)
```

### Test Runs Table
```sql
id, project_id, run_type, status,
total_tests, passed_tests, failed_tests, error_tests,
job_id, started_at, completed_at, duration
```

### Test Executions Table
```sql
id, run_id, test_id, status, duration,
request (JSON), response (JSON),
test_results (JSON), assertion_results (JSON)
```

## 🎨 UI Redesign (In Progress)

The UI is being redesigned with:

- 🌙 **Dark theme by default**
- 📊 **Dashboard layout** (compact, table-based)
- 🔍 **Test filtering** (search, category, status)
- ▶️ **Flexible execution modes**:
  - Run entire collection
  - Run selected tests
  - Run by search query
  - Run all tests
- 📈 **Enhanced result visualization**
  - Pass/fail overview
  - Request/response diff
  - Assertion details
  - Performance metrics

## 🛠️ Troubleshooting

### Worker not processing jobs

```bash
# Check Redis connection
redis-cli ping

# View worker logs
npm run worker

# Check queue status
# (Add BullBoard UI for monitoring)
```

### Database errors

```bash
# Reset database
rm -rf data/test-please.db
npm run dev  # Will recreate on startup
```

### Test execution fails

- Check environment variables are set
- Verify baseUrl in environment
- Check pre-request script errors in logs
- Validate .bru file syntax

## 📚 References

- [Bruno Documentation](https://docs.usebruno.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🔜 Roadmap

- [ ] Complete UI redesign (dark theme dashboard)
- [ ] Add collection/selection/search execution modes
- [ ] Implement result visualization dashboard
- [ ] Add CI/CD integration
- [ ] WebSocket support for real-time updates
- [ ] Test history and comparison
- [ ] Export results to various formats
- [ ] Bulk test operations
- [ ] Advanced filtering and search
