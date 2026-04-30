/**
 * Standardized API Error Type
 * Used across all API routes to provide proper TypeScript typing
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class AppError extends Error implements ApiError {
  code?: string;
  status: number;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return (error as Error).message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return 'An unknown error occurred';
}

/**
 * Maps common database/business logic errors to appropriate HTTP status codes
 */
export function mapErrorToStatus(error: unknown): number {
  const message = getErrorMessage(error).toLowerCase();

  if (error instanceof AppError) return error.status;

  if (message.includes('unauthorized') || message.includes('invalid token')) return 401;
  if (message.includes('forbidden') || message.includes('permission denied')) return 403;
  if (message.includes('not found')) return 404;
  if (message.includes('duplicate') || message.includes('already exists')) return 409;
  if (message.includes('invalid') || message.includes('required')) return 400;

  return 500;
}
