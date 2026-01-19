/**
 * Example OpenAPI Specification for Todo API
 * Generates a complete OpenAPI 3.0 specification for demonstration purposes
 */

export function getExampleOpenAPISpec(baseUrl: string) {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Example Todo API',
      version: '1.0.0',
      description:
        'A simple Todo API for testing the API Test Platform. This API provides CRUD operations for managing todo items with features like priority levels, completion tracking, and filtering capabilities.',
      contact: {
        name: 'API Test Platform',
        url: baseUrl,
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'todos',
        description: 'Todo management operations',
      },
    ],
    paths: {
      '/api/example/todos': {
        get: {
          tags: ['todos'],
          summary: 'List all todos',
          description: 'Retrieve a list of todos with optional filtering by completion status, priority, and limit',
          operationId: 'listTodos',
          parameters: [
            {
              name: 'completed',
              in: 'query',
              description: 'Filter by completion status',
              required: false,
              schema: {
                type: 'boolean',
              },
              example: false,
            },
            {
              name: 'priority',
              in: 'query',
              description: 'Filter by priority level',
              required: false,
              schema: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
              },
              example: 'high',
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of results to return',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
              },
              example: 10,
            },
          ],
          responses: {
            '200': {
              description: 'Successful response with list of todos',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoListResponse',
                  },
                  example: {
                    success: true,
                    data: {
                      todos: [
                        {
                          id: '1',
                          title: 'Setup development environment',
                          description: 'Install Node.js, npm, and required dependencies',
                          completed: true,
                          priority: 'high',
                          createdAt: '2024-01-15T10:00:00Z',
                          updatedAt: '2024-01-15T14:30:00Z',
                        },
                        {
                          id: '2',
                          title: 'Write API documentation',
                          description: 'Document all endpoints with examples',
                          completed: false,
                          priority: 'high',
                          createdAt: '2024-01-16T09:00:00Z',
                          updatedAt: '2024-01-16T09:00:00Z',
                        },
                      ],
                      total: 2,
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['todos'],
          summary: 'Create a new todo',
          description: 'Create a new todo item with title, description, priority, and completion status',
          operationId: 'createTodo',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TodoInput',
                },
                example: {
                  title: 'Implement new feature',
                  description: 'Add user authentication to the application',
                  completed: false,
                  priority: 'high',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Todo created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                  example: {
                    success: true,
                    data: {
                      todo: {
                        id: '9',
                        title: 'Implement new feature',
                        description: 'Add user authentication to the application',
                        completed: false,
                        priority: 'high',
                        createdAt: '2024-01-20T10:00:00Z',
                        updatedAt: '2024-01-20T10:00:00Z',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid input',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                  example: {
                    success: false,
                    error: 'Title is required and must be a non-empty string',
                  },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/api/example/todos/{id}': {
        get: {
          tags: ['todos'],
          summary: 'Get a single todo',
          description: 'Retrieve a specific todo by its ID',
          operationId: 'getTodoById',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'Todo ID',
              required: true,
              schema: {
                type: 'string',
              },
              example: '1',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response with todo details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                  example: {
                    success: true,
                    data: {
                      todo: {
                        id: '1',
                        title: 'Setup development environment',
                        description: 'Install Node.js, npm, and required dependencies',
                        completed: true,
                        priority: 'high',
                        createdAt: '2024-01-15T10:00:00Z',
                        updatedAt: '2024-01-15T14:30:00Z',
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                  example: {
                    success: false,
                    error: 'Todo not found',
                  },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['todos'],
          summary: 'Update a todo',
          description: 'Update an existing todo by its ID. All fields are optional.',
          operationId: 'updateTodo',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'Todo ID',
              required: true,
              schema: {
                type: 'string',
              },
              example: '1',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TodoUpdateInput',
                },
                example: {
                  completed: true,
                  priority: 'low',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Todo updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TodoResponse',
                  },
                  example: {
                    success: true,
                    data: {
                      todo: {
                        id: '1',
                        title: 'Setup development environment',
                        description: 'Install Node.js, npm, and required dependencies',
                        completed: true,
                        priority: 'low',
                        createdAt: '2024-01-15T10:00:00Z',
                        updatedAt: '2024-01-20T11:00:00Z',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid input',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                  example: {
                    success: false,
                    error: 'Todo not found',
                  },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['todos'],
          summary: 'Delete a todo',
          description: 'Delete an existing todo by its ID',
          operationId: 'deleteTodo',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'Todo ID',
              required: true,
              schema: {
                type: 'string',
              },
              example: '1',
            },
          ],
          responses: {
            '200': {
              description: 'Todo deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      data: {
                        type: 'object',
                        properties: {
                          message: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                  example: {
                    success: true,
                    data: {
                      message: 'Todo deleted successfully',
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Todo not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                  example: {
                    success: false,
                    error: 'Todo not found',
                  },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Todo: {
          type: 'object',
          required: ['id', 'title', 'completed', 'priority', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the todo',
              example: '1',
            },
            title: {
              type: 'string',
              description: 'Todo title',
              minLength: 1,
              maxLength: 200,
              example: 'Setup development environment',
            },
            description: {
              type: 'string',
              description: 'Optional detailed description',
              maxLength: 1000,
              example: 'Install Node.js, npm, and required dependencies',
            },
            completed: {
              type: 'boolean',
              description: 'Whether the todo is completed',
              example: false,
            },
            priority: {
              type: 'string',
              description: 'Priority level of the todo',
              enum: ['low', 'medium', 'high'],
              example: 'high',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the todo was created',
              example: '2024-01-15T10:00:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the todo was last updated',
              example: '2024-01-15T14:30:00Z',
            },
          },
        },
        TodoInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              description: 'Todo title',
              minLength: 1,
              maxLength: 200,
              example: 'Implement new feature',
            },
            description: {
              type: 'string',
              description: 'Optional detailed description',
              maxLength: 1000,
              example: 'Add user authentication to the application',
            },
            completed: {
              type: 'boolean',
              description: 'Whether the todo is completed (defaults to false)',
              default: false,
              example: false,
            },
            priority: {
              type: 'string',
              description: 'Priority level (defaults to medium)',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
              example: 'high',
            },
          },
        },
        TodoUpdateInput: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Todo title',
              minLength: 1,
              maxLength: 200,
              example: 'Updated title',
            },
            description: {
              type: 'string',
              description: 'Optional detailed description',
              maxLength: 1000,
              example: 'Updated description',
            },
            completed: {
              type: 'boolean',
              description: 'Whether the todo is completed',
              example: true,
            },
            priority: {
              type: 'string',
              description: 'Priority level',
              enum: ['low', 'medium', 'high'],
              example: 'low',
            },
          },
        },
        TodoListResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                todos: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Todo',
                  },
                },
                total: {
                  type: 'integer',
                  description: 'Total number of todos returned',
                  example: 8,
                },
              },
            },
          },
        },
        TodoResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                todo: {
                  $ref: '#/components/schemas/Todo',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Todo not found',
            },
          },
        },
      },
    },
  };
}
