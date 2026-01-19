import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating a collection
const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  apiTitle: z.string().optional(),
  apiVersion: z.string().optional(),
  baseUrl: z.string().optional(),
});

// GET /api/collections/[id] - Get a single collection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        tests: {
          orderBy: [
            { order: 'asc' },
            { createdAt: 'desc' },
          ],
        },
        _count: {
          select: {
            tests: true,
            testRuns: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Collection not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collection',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/collections/[id] - Update a collection
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = updateCollectionSchema.parse(body);

    const collection = await prisma.collection.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Prisma error for record not found
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Collection not found',
        },
        { status: 404 }
      );
    }

    console.error('Error updating collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update collection',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.collection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    // Prisma error for record not found
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Collection not found',
        },
        { status: 404 }
      );
    }

    console.error('Error deleting collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete collection',
      },
      { status: 500 }
    );
  }
}
