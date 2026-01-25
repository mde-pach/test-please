import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { projects, collections, tests, environments } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const db = await getDb();

    // Get project
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get collections
    const projectCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.projectId, projectId));

    // Get all tests for this project
    const collectionIds = projectCollections.map(c => c.id);
    let projectTests: any[] = [];

    if (collectionIds.length > 0) {
      const allTests = await db.select().from(tests);
      projectTests = allTests.filter(t => collectionIds.includes(t.collectionId));
    }

    // Get environments
    const projectEnvs = await db
      .select()
      .from(environments)
      .where(eq(environments.projectId, projectId));

    // Group tests by collection
    const collectionsWithTests = projectCollections.map(col => ({
      id: col.id,
      name: col.name,
      description: col.description,
      tests: projectTests
        .filter(t => t.collectionId === col.id)
        .map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          testType: t.testType,
          endpointPath: t.endpointPath,
          method: t.method,
          tags: t.tags,
          createdAt: t.createdAt,
        })),
    }));

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        apiInfo: project.apiInfo,
        collections: collectionsWithTests,
        environments: projectEnvs,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });

  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const db = await getDb();

    // Delete project (cascades to collections, tests, etc.)
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
