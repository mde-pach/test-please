import { NextRequest, NextResponse } from 'next/server';
import { getTodoById, updateTodo, deleteTodo, validateTodoInput, type TodoInput } from '@/lib/example-data';

/**
 * GET /api/example/todos/:id
 * Get a single todo by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const todo = getTodoById(params.id);

    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        todo,
      },
    });
  } catch (error) {
    console.error('Error getting todo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get todo',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/example/todos/:id
 * Update a todo by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate input (all fields optional for update)
    const validation = validateTodoInput({ title: 'placeholder', ...body });
    if (!validation.valid && body.title) {
      // Only validate if validation fails and we're actually updating title
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Update todo
    const todo = updateTodo(params.id, body as Partial<TodoInput>);

    if (!todo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        todo,
      },
    });
  } catch (error) {
    console.error('Error updating todo:', error);

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
        error: error instanceof Error ? error.message : 'Failed to update todo',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/example/todos/:id
 * Delete a todo by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deleteTodo(params.id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todo not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Todo deleted successfully',
      },
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete todo',
      },
      { status: 500 }
    );
  }
}
