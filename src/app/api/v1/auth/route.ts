import { withHandler } from '@/app/api/api-utils';
import { authService } from '@/lib/services/auth.service';
import { UserMapper } from '@/lib/mappers';
import { rbac } from '@/lib/auth/rbac';
import { cookies } from 'next/headers';
import { USER_ROLES, SESSION, SIGNUP_LIMITS } from '@/lib/constants';
import { verifyToken, createSession } from '@/lib/crypto';
import { validateLoginForm, normalizeEmail, validateSignupForm, normalizeInput, sanitizeObject } from '@/lib/validation';
import { User } from '@/lib/types';
import { UnauthorizedError, BadRequestError } from '@/lib/api-error';

export const GET = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
        case 'me':
            return user ? UserMapper.toDTO(user) : null;
        case 'session': {
            const cookieStore = await cookies();
            const token = cookieStore.get('app-user-session');
            if (!token) return null;
            return await verifyToken(token.value);
        }
        case 'role-count': {
            return authService.getRoleCount();
        }
        default:
            return user ? UserMapper.toDTO(user) : null;
    }
}, { requireAuth: false });

export const POST = withHandler(async (user, request) => {
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);
    const { action, ...data } = body;

    switch (action) {
        case 'login': {
            const validation = validateLoginForm(data.email, data.password || '');
            if (!validation.isValid) {
              throw new BadRequestError(validation.errors[0].message);
            }

            const normalizedEmail = normalizeEmail(data.email);
            const { data: rawData, error: rpcError } = await authService.authenticate(normalizedEmail, data.password || '');

            if (rpcError) throw new Error('Authentication service unavailable');

            const result = rawData as { success: boolean, user: User, session_id: string, error?: string };
            if (!result.success) {
              throw new UnauthorizedError(result.error || 'Invalid credentials');
            }

            const sessionId = result.session_id;
            const token = await createSession({
                id: result.user?.id,
                role: result.user?.role,
                sessionId: sessionId
            });

            (await cookies()).set('app-user-session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * SESSION.EXPIRY_DAYS
            });

            return {
                user: UserMapper.toDTO(result.user),
                sessionId: sessionId
            };
        }
        case 'signup': {
            const validation = validateSignupForm(
              data.full_name,
              data.email,
              data.password || '',
              data.password || '',
              data.phone
            );

            if (!validation.isValid) {
              throw new BadRequestError(validation.errors[0].message);
            }

            // Role limit check
            if (data.role === USER_ROLES.TEACHER || data.role === USER_ROLES.ADMIN) {
                const count = await authService.getRoleUserCount(data.role);

                const limit = data.role === USER_ROLES.TEACHER ? SIGNUP_LIMITS.TEACHER : SIGNUP_LIMITS.ADMIN;
                if (count >= limit) {
                    throw new BadRequestError(`Signup limit reached for role: ${data.role}`);
                }
            }

            const { data: rawData, error: rpcError } = await authService.register({
              full_name: normalizeInput(data.full_name),
              email: normalizeEmail(data.email),
              password: data.password || '',
              phone: data.phone ? normalizeInput(data.phone) : undefined,
              role: data.role || USER_ROLES.STUDENT
            });

            if (rpcError) throw new Error('Signup service unavailable');

            const result = rawData as { success: boolean, user: User, session_id: string, error?: string };
            if (!result.success) throw new BadRequestError(result.error || 'Signup failed');

            const sessionId = result.session_id;
            const token = await createSession({
                id: result.user?.id,
                role: result.user?.role,
                sessionId: sessionId
            });

            (await cookies()).set('app-user-session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * SESSION.EXPIRY_DAYS
            });

            return {
                user: UserMapper.toDTO(result.user),
                sessionId: sessionId
            };
        }
        case 'logout':
            (await cookies()).delete('app-user-session');
            return { success: true };
        case 'profile': {
            if (!user) throw new UnauthorizedError();
            const updated = await authService.updateUserProfile(user, user.id, data, user.sessionId!);
            return UserMapper.toDTO(updated);
        }
        case 'password': {
            if (!user) throw new UnauthorizedError();
            const result = await authService.updatePassword(data.currentPassword, data.newPassword, user.sessionId!);

            // Invalidate current cookie to force re-login (Token Rotation)
            if (result && typeof result === 'object' && 'success' in result && result.success) {
                (await cookies()).delete('app-user-session');
            }

            return result;
        }
        case 'reset-request': {
            if (data.subAction === 'request') {
                return await authService.requestPasswordReset(data.email, data.reason, data.riskLevel);
            }
            if (!user) throw new UnauthorizedError();
            if (data.subAction === 'approve') {
                if (!rbac.can(user, 'user:manage')) throw new UnauthorizedError();
                return await authService.approvePasswordReset(data.userId, data.tempPassword, user.sessionId!);
            } else {
                if (!rbac.can(user, 'user:manage')) throw new UnauthorizedError();
                return await authService.denyPasswordReset(data.userId, data.reason, user.sessionId!);
            }
        }
        case 'preferences': {
            if (!user) throw new UnauthorizedError();
            return await authService.updatePreferences(data.preferences, user.sessionId!);
        }
        default:
            throw new Error('Invalid POST action');
    }
}, { requireAuth: false });
