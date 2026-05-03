import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/crypto';
import { authService } from '@/lib/services/auth.service';
import { User } from '@/lib/types';
import { getErrorMessage, mapErrorToStatus } from '@/lib/api-error';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('app-user-session');
  if (!token) return null;

  const session = await verifyToken(token.value);
  if (!session || !session.sessionId) return null;

  return authService.getCurrentUser(session.id as string, session.sessionId as string);
}

export function handleUnauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export function handleBadRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function handleSuccess<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export function handleError(error: unknown) {
  const message = getErrorMessage(error);
  const status = mapErrorToStatus(error);
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Standardized API Route handler wrapper
 */
export function withHandler<T>(
  handler: (user: User, request: Request) => Promise<T>,
  options: { requireAuth?: boolean } = { requireAuth: true }
) {
  return async (request: Request) => {
    let user: User | null = null;

    if (options.requireAuth) {
      user = await getSessionUser();
      if (!user) return handleUnauthorized();
    }

    try {
      const result = await handler(user as User, request);
      return handleSuccess(result);
    } catch (error: unknown) {
      return handleError(error);
    }
  };
}
