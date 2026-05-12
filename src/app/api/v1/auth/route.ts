import { withHandler } from '@/app/api/api-utils';
import { authService } from '@/lib/services/auth.service';
import { UserMapper } from '@/lib/mappers';
import { rbac } from '@/lib/auth/rbac';
import { cookies } from 'next/headers';
import { SESSION } from '@/lib/constants';
import { validateLoginForm, normalizeEmail, validateSignupForm, normalizeInput, sanitizeObject } from '@/lib/validation';
import { User } from '@/lib/types';
import { UnauthorizedError, BadRequestError } from '@/lib/api-error';

export const GET = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
        case 'me':
            return user ? UserMapper.toDTO(user) : null;
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
            const result = await authService.authenticate(normalizedEmail, data.password || '');

            (await cookies()).set('app-user-session', result.session_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * SESSION.EXPIRY_DAYS
            });

            return {
                user: UserMapper.toDTO(result.user)
            };
        }
        case 'signup': {
            const validation = validateSignupForm(
              data.full_name,
              data.email,
              data.password || '',
              data.confirmPassword || '',
              data.phone
            );

            if (!validation.isValid) {
              throw new BadRequestError(validation.errors[0].message);
            }

            const result = await authService.signup({
              full_name: normalizeInput(data.full_name),
              email: normalizeEmail(data.email),
              password: data.password || '',
              confirmPassword: data.confirmPassword || '',
              phone: data.phone ? normalizeInput(data.phone) : undefined,
              role: data.role
            });

            (await cookies()).set('app-user-session', result.session_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * SESSION.EXPIRY_DAYS
            });

            return {
                user: UserMapper.toDTO(result.user)
            };
        }
        case 'logout':
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('app-user-session');
            if (sessionCookie) {
                await authService.logout(sessionCookie.value);
            }
            cookieStore.delete('app-user-session');
            return { success: true };
        case 'profile': {
            if (!user) throw new UnauthorizedError();
            const updated = await authService.updateUserProfile(user, user.id, data, user.sessionId!);
            return UserMapper.toDTO(updated);
        }
        case 'password': {
            if (!user) throw new UnauthorizedError();

            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('app-user-session');
            if (!sessionCookie) throw new UnauthorizedError();

            const result = await authService.updatePassword(data.currentPassword, data.newPassword, sessionCookie.value);

            if (result && typeof result === 'object' && 'success' in result && result.success) {
                cookieStore.delete('app-user-session');
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
                return await authService.approvePasswordReset(data.userId, data.tempPassword, user);
            } else {
                if (!rbac.can(user, 'user:manage')) throw new UnauthorizedError();
                return await authService.denyPasswordReset(data.userId, data.reason, user);
            }
        }
        case 'preferences': {
            if (!user) throw new UnauthorizedError();
            return await authService.updatePreferences(data.preferences, user);
        }
        default:
            throw new Error('Invalid POST action');
    }
}, { requireAuth: false, checkCSRF: true });
