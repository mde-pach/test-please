import { NextRequest, NextResponse } from 'next/server';
import { getTodos, createTodo, validateTodoInput, type TodoInput } from '@/lib/example-data';

/**
 * GET /api/example/todos
 * List todos with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const completedParam = searchParams.get('completed');
    const completed =
      completedParam === 'true' ? true : completedParam === 'false' ? false : undefined;

    const priority = searchParams.get('priority') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Validate limit parameter
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be a number between 1 and 100',
        },
        { status: 400 }
      );
    }

    // Validate priority parameter
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Priority must be one of: low, medium, high',
        },
        { status: 400 }
      );
    }

    // Get filtered todos
    const todos = getTodos({ completed, priority, limit });

    return NextResponse.json({
      success: true,
      data: {
        todos,
        total: todos.length,
      },
    });
  } catch (error) {
    console.error('Error listing todos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list todos',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/example/todos
 * Create a new todo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateTodoInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Create todo
    const todo = createTodo(body as TodoInput);

    return NextResponse.json(
      {
        success: true,
        data: {
          todo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating todo:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todo',
      },
      { status: 500 }
    );
  }
}
