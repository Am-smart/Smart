import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/auth.service';
import { User } from '@/lib/types';
import { getErrorMessage, mapErrorToStatus } from '@/lib/api-error';
import { headers } from 'next/headers';

export async function getSessionUser(request?: Request): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('app-user-session');
    if (!token) return null;

    // Validate session against database and get user
    const userSession = await authService.validateSession(token.value);
    if (!userSession) return null;

    return userSession as User;
  } catch {
    return null;
  }
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
  options: { requireAuth?: boolean; checkCSRF?: boolean } = { requireAuth: true, checkCSRF: true }
) {
  return async (request: Request) => {
    // CSRF Protection
    if (options.checkCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const headerList = await headers();
        const origin = headerList.get('origin');
        const referer = headerList.get('referer');
        const host = headerList.get('host');

        // State-changing requests MUST have Origin or Referer
        if (!origin && !referer) {
            return NextResponse.json({ success: false, error: 'CSRF Protection: Origin/Referer required' }, { status: 403 });
        }

        // Basic check: Origin must match Host if present
        if (origin) {
            try {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    return NextResponse.json({ success: false, error: 'CSRF Protection: Invalid Origin' }, { status: 403 });
                }
            } catch {
                return NextResponse.json({ success: false, error: 'CSRF Protection: Malformed Origin' }, { status: 403 });
            }
        } else if (referer) {
            try {
                const refererHost = new URL(referer).host;
                if (refererHost !== host) {
                    return NextResponse.json({ success: false, error: 'CSRF Protection: Invalid Referer' }, { status: 403 });
                }
            } catch {
                return NextResponse.json({ success: false, error: 'CSRF Protection: Malformed Referer' }, { status: 403 });
            }
        }
    }

    try {
      const user = await getSessionUser(request);
      if (options.requireAuth && !user) {
        return handleUnauthorized();
      }

      const result = await handler(user as User, request);
      return handleSuccess(result);
    } catch (error: unknown) {
      return handleError(error);
    }
  };
}
