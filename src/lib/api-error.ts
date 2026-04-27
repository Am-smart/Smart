/**
 * Standardized API Error Type
 * Used across all API routes to provide proper TypeScript typing
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return 'An unknown error occurred';
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
