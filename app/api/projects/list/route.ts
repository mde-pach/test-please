import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();

    // Get all projects ordered by most recent first
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(100);

    return NextResponse.json({
      success: true,
      projects: allProjects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        apiInfo: p.apiInfo,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        metadata: p.metadata,
      })),
    });

  } catch (error: any) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list projects' },
      { status: 500 }
    );
  }
}
