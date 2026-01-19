# Phase 1 Implementation - Setup & Testing Guide

## Overview
Phase 1 (Foundation) has been successfully implemented with:
- ✅ PostgreSQL + Prisma database setup
- ✅ API routes for Projects and Collections (CRUD operations)
- ✅ Dashboard UI with dark theme
- ✅ Project and Collection management interfaces

---

## Prerequisites

Before running the application, ensure you have:
- Node.js 18+ installed
- Docker and Docker Compose installed (for PostgreSQL and Redis)
- npm or yarn package manager

---

## Setup Instructions

### 1. Install Dependencies

Dependencies have already been installed, but if you need to reinstall:

```bash
npm install
```

### 2. Start PostgreSQL Database

Start the PostgreSQL container using Docker Compose:

```bash
# Start PostgreSQL only
docker compose up -d postgres

# Verify it's running
docker compose ps
```

The database will be available at:
- **Host**: localhost
- **Port**: 5432
- **Database**: bruno_test_platform
- **User**: brunouser
- **Password**: brunopass

### 3. Configure Environment Variables

The `.env` file has been created with database connection details. If you need to modify it:

```bash
DATABASE_URL="postgresql://brunouser:brunopass@localhost:5432/bruno_test_platform"
REDIS_URL="redis://localhost:6379"
ANTHROPIC_API_KEY=""  # Add your API key for Phase 2
```

### 4. Run Prisma Migrations

Generate the Prisma client and create database tables:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Optional: View database in Prisma Studio
npx prisma studio
```

This will create 5 tables:
- `Project` - Top-level projects/workspaces
- `Collection` - Bruno test collections
- `Test` - Individual .bru test files
- `TestRun` - Test execution history
- `TestResult` - Per-test results

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## Testing Phase 1 Features

### Test 1: Create a Project

1. Navigate to http://localhost:3000
2. You should see the Projects dashboard with dark theme
3. Click "+ New Project" button
4. Fill in the form:
   - Name: "My First Project"
   - Description: "Testing the API management platform"
5. Click "Create Project"
6. The project should appear in the table immediately

**Expected Result**: Project appears in table with 0 collections and 0 test runs

### Test 2: View Project Details

1. Click "View" or the project name in the table
2. You should be redirected to `/projects/{id}`
3. You should see:
   - Project name and description
   - Stats cards (Collections: 0, Test Runs: 0, Total Tests: 0)
   - Empty collections table with message "No collections yet"

**Expected Result**: Project detail page displays correctly with stats

### Test 3: Create a Collection

1. On the project detail page, click "+ New Collection"
2. Fill in the form:
   - Collection Name: "User API Tests"
   - Description: "Tests for user management endpoints"
   - Base URL: "https://api.example.com"
3. Click "Create Collection"
4. The collection should appear in the table

**Expected Result**: Collection appears in table with 0 tests

### Test 4: Navigate Back to Dashboard

1. Click "Projects" in the breadcrumb or top navigation
2. You should return to the main dashboard
3. Your project should now show:
   - Collections: 1
   - Test Runs: 0

**Expected Result**: Stats are updated correctly

### Test 5: API Endpoint Testing

Test the API endpoints directly using curl or Postman:

```bash
# Get all projects
curl http://localhost:3000/api/projects

# Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test Project","description":"Created via API"}'

# Get a specific project (replace {id} with actual ID)
curl http://localhost:3000/api/projects/{id}

# Create a collection (replace {projectId} with actual ID)
curl -X POST http://localhost:3000/api/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name":"API Collection",
    "description":"Test collection",
    "projectId":"{projectId}",
    "baseUrl":"https://api.example.com"
  }'
```

**Expected Result**: All API endpoints return JSON responses with `success: true`

### Test 6: Database Verification

Verify data is persisted in PostgreSQL:

```bash
# Open Prisma Studio
npx prisma studio
```

This opens a web UI at http://localhost:5555 where you can:
- Browse all tables
- View created projects and collections
- Verify relationships are working

**Expected Result**: All created data visible in database

### Test 7: Dark Theme Verification

1. Inspect the page - `<html>` tag should have `class="dark"`
2. Verify all UI elements use dark colors:
   - Background: Dark gray/black (#0a0a0a, #111827, etc.)
   - Text: White and light gray
   - Tables: Dark with subtle borders
   - Buttons: Blue accent with proper hover states

**Expected Result**: Entire UI uses dark theme

---

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

```bash
# Check if PostgreSQL is running
docker compose ps

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Prisma Client Not Found

If you get "Cannot find module '@prisma/client'":

```bash
# Regenerate Prisma client
npx prisma generate
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Run on a different port
PORT=3001 npm run dev
```

### Database Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then run migrations again
npx prisma migrate dev
```

---

## What's Implemented in Phase 1

### ✅ Database Layer
- Prisma schema with 5 models (Project, Collection, Test, TestRun, TestResult)
- PostgreSQL database setup via Docker
- Prisma client singleton for database access

### ✅ API Routes
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update a project
- `DELETE /api/projects/[id]` - Delete a project
- `GET /api/collections` - List collections (with optional projectId filter)
- `POST /api/collections` - Create a collection
- `GET /api/collections/[id]` - Get collection details
- `PATCH /api/collections/[id]` - Update a collection
- `DELETE /api/collections/[id]` - Delete a collection

### ✅ UI Components
- Dashboard layout with navigation (DashboardNav)
- Projects dashboard with table view (ProjectTable)
- Project detail page with collections (CollectionTable)
- Create forms for projects and collections
- Dark theme with Tailwind CSS
- Responsive design

### ✅ Infrastructure
- Docker Compose setup (PostgreSQL + Redis)
- Environment variables configuration
- TypeScript setup
- Next.js 14 App Router structure

---

## What's Coming in Phase 2

Phase 2 will focus on **Bruno Integration** (Test Generation):
- Install Bruno libraries (@usebruno/lang, @usebruno/cli)
- Create Bruno generator service (OpenAPI → .bru files)
- Refactor AI client for Bruno-style test generation
- API endpoint for generating tests from OpenAPI specs
- Tests table and preview UI
- Store .bru file content in database

---

## File Structure Created

```
/home/user/test-please/
├── prisma/
│   └── schema.prisma                          # Database schema (5 models)
├── lib/
│   └── db.ts                                   # Prisma client singleton
├── app/
│   ├── layout.tsx                              # Root layout (dark theme)
│   ├── (dashboard)/
│   │   ├── layout.tsx                          # Dashboard shell
│   │   ├── page.tsx                            # Projects list
│   │   ├── projects/[id]/page.tsx              # Project detail
│   │   ├── runs/page.tsx                       # Placeholder for Phase 4
│   │   └── settings/page.tsx                   # Placeholder
│   └── api/
│       ├── projects/
│       │   ├── route.ts                        # GET, POST
│       │   └── [id]/route.ts                   # GET, PATCH, DELETE
│       └── collections/
│           ├── route.ts                        # GET, POST
│           └── [id]/route.ts                   # GET, PATCH, DELETE
├── components/
│   ├── layout/
│   │   └── DashboardNav.tsx                    # Top navigation
│   ├── projects/
│   │   └── ProjectTable.tsx                    # Projects table
│   └── collections/
│       └── CollectionTable.tsx                 # Collections table
├── docker-compose.yml                          # PostgreSQL + Redis
├── .env                                        # Environment variables
├── .env.example                                # Template
└── PHASE1_SETUP.md                             # This file
```

---

## Success Criteria Checklist

- ✅ PostgreSQL database running via Docker
- ✅ Prisma schema created with all 5 models
- ✅ Database migrations executed successfully
- ✅ API routes functional (Projects and Collections CRUD)
- ✅ Dashboard UI displaying in dark theme
- ✅ Can create projects via UI
- ✅ Can create collections within a project
- ✅ Data persists across page reloads
- ✅ Navigation works between pages
- ✅ Table-based layouts are compact and scannable

---

## Next Steps

Once you've verified Phase 1 is working:

1. **Add your Anthropic API key** to `.env` for AI test generation in Phase 2
2. **Start Redis** for job queue in Phase 3:
   ```bash
   docker compose up -d redis
   ```
3. **Review the implementation plan** at `/root/.claude/plans/optimized-petting-trinket.md`
4. **Ready for Phase 2**: Bruno integration and test generation

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify all dependencies are installed: `npm install`
3. Ensure Docker is running: `docker compose ps`
4. Check logs: `docker compose logs`
5. Review Prisma Studio for database state: `npx prisma studio`
