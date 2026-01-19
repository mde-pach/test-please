import { v4 as uuidv4 } from 'uuid';

/**
 * Example Todo API - In-memory mock data
 * Provides a simple CRUD API for demonstration purposes
 * Data resets on server restart
 */

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface TodoInput {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

// In-memory storage (resets on server restart)
let todos: Todo[] = [
  {
    id: '1',
    title: 'Setup development environment',
    description: 'Install Node.js, npm, and required dependencies',
    completed: true,
    priority: 'high',
    createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T14:30:00Z').toISOString(),
  },
  {
    id: '2',
    title: 'Write API documentation',
    description: 'Document all endpoints with examples and response formats',
    completed: false,
    priority: 'high',
    createdAt: new Date('2024-01-16T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-16T09:00:00Z').toISOString(),
  },
  {
    id: '3',
    title: 'Implement authentication',
    description: 'Add JWT-based authentication to API endpoints',
    completed: false,
    priority: 'medium',
    createdAt: new Date('2024-01-17T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-17T11:00:00Z').toISOString(),
  },
  {
    id: '4',
    title: 'Write unit tests',
    description: 'Achieve 80% code coverage with unit tests',
    completed: false,
    priority: 'medium',
    createdAt: new Date('2024-01-18T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-18T08:00:00Z').toISOString(),
  },
  {
    id: '5',
    title: 'Update README',
    description: 'Add installation and usage instructions',
    completed: true,
    priority: 'low',
    createdAt: new Date('2024-01-14T15:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T16:00:00Z').toISOString(),
  },
  {
    id: '6',
    title: 'Deploy to staging',
    description: 'Deploy application to staging environment for testing',
    completed: false,
    priority: 'high',
    createdAt: new Date('2024-01-19T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-19T10:00:00Z').toISOString(),
  },
  {
    id: '7',
    title: 'Review pull requests',
    description: 'Review and merge pending pull requests from team members',
    completed: false,
    priority: 'medium',
    createdAt: new Date('2024-01-18T13:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-18T13:00:00Z').toISOString(),
  },
  {
    id: '8',
    title: 'Fix security vulnerabilities',
    description: 'Address critical security issues found in dependency audit',
    completed: false,
    priority: 'high',
    createdAt: new Date('2024-01-17T16:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-17T16:00:00Z').toISOString(),
  },
];

export interface TodoFilters {
  completed?: boolean;
  priority?: string;
  limit?: number;
}

/**
 * Get all todos with optional filtering
 */
export function getTodos(filters?: TodoFilters): Todo[] {
  let result = [...todos];

  // Filter by completed status
  if (filters?.completed !== undefined) {
    result = result.filter(todo => todo.completed === filters.completed);
  }

  // Filter by priority
  if (filters?.priority) {
    result = result.filter(todo => todo.priority === filters.priority);
  }

  // Apply limit
  if (filters?.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  // Sort by createdAt descending (newest first)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return result;
}

/**
 * Get a single todo by ID
 */
export function getTodoById(id: string): Todo | undefined {
  return todos.find(todo => todo.id === id);
}

/**
 * Create a new todo
 */
export function createTodo(input: TodoInput): Todo {
  const now = new Date().toISOString();

  const newTodo: Todo = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    completed: input.completed ?? false,
    priority: input.priority ?? 'medium',
    createdAt: now,
    updatedAt: now,
  };

  todos.push(newTodo);
  return newTodo;
}

/**
 * Update an existing todo
 */
export function updateTodo(id: string, updates: Partial<TodoInput>): Todo | undefined {
  const index = todos.findIndex(todo => todo.id === id);

  if (index === -1) {
    return undefined;
  }

  const updatedTodo: Todo = {
    ...todos[index],
    ...updates,
    id, // Ensure ID cannot be changed
    updatedAt: new Date().toISOString(),
  };

  todos[index] = updatedTodo;
  return updatedTodo;
}

/**
 * Delete a todo by ID
 */
export function deleteTodo(id: string): boolean {
  const index = todos.findIndex(todo => todo.id === id);

  if (index === -1) {
    return false;
  }

  todos.splice(index, 1);
  return true;
}

/**
 * Validate todo input
 */
export function validateTodoInput(input: any): { valid: boolean; error?: string } {
  if (!input) {
    return { valid: false, error: 'Request body is required' };
  }

  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    return { valid: false, error: 'Title is required and must be a non-empty string' };
  }

  if (input.title.length > 200) {
    return { valid: false, error: 'Title must be 200 characters or less' };
  }

  if (input.description !== undefined && typeof input.description !== 'string') {
    return { valid: false, error: 'Description must be a string' };
  }

  if (input.description && input.description.length > 1000) {
    return { valid: false, error: 'Description must be 1000 characters or less' };
  }

  if (input.completed !== undefined && typeof input.completed !== 'boolean') {
    return { valid: false, error: 'Completed must be a boolean' };
  }

  if (input.priority !== undefined && !['low', 'medium', 'high'].includes(input.priority)) {
    return { valid: false, error: 'Priority must be one of: low, medium, high' };
  }

  return { valid: true };
}
