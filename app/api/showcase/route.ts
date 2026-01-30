import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateShowcaseProject } from '@/lib/showcase-project';

/**
 * GET /api/showcase
 * Create or get the showcase project
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = await getOrCreateShowcaseProject();

    return NextResponse.json({
      success: true,
      projectId,
      message: 'Showcase project ready',
    });
  } catch (error: any) {
    console.error('Error creating showcase project:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create showcase project',
      },
      { status: 500 }
    );
  }
}
