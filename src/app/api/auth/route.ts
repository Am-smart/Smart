import { withHandler } from '@/app/api/api-utils';
import { authService } from '@/lib/services/auth.service';
import { UserMapper } from '@/lib/mappers';
import { cookies } from 'next/headers';
import { USER_ROLES } from '@/lib/constants';
import { verifyToken, createSession } from '@/lib/crypto';
import { supabaseServer as supabase } from '@/lib/supabase-server';
import { validateLoginForm, normalizeEmail, validateSignupForm, normalizeInput } from '@/lib/validation';
import { User } from '@/lib/types';

export const GET = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
        case 'me':
            return UserMapper.toDTO(user);
        case 'session': {
            const cookieStore = await cookies();
            const token = cookieStore.get('app-user-session');
            if (!token) return null;
            return await verifyToken(token.value);
        }
        case 'role-count': {
            const [teachers, admins, total] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', USER_ROLES.TEACHER),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', USER_ROLES.ADMIN),
                supabase.from('users').select('*', { count: 'exact', head: true })
            ]);
            return {
                teachers: teachers.count || 0,
                admins: admins.count || 0,
                total: total.count || 0
            };
        }
        default:
            return UserMapper.toDTO(user);
    }
}, { requireAuth: false });

export const POST = withHandler(async (user, request) => {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
        case 'login': {
            const validation = validateLoginForm(data.email, data.password || '');
            if (!validation.isValid) {
              return { user: null, sessionId: null, error: validation.errors[0].message };
            }

            const normalizedEmail = normalizeEmail(data.email);
            const { data: rawData, error: rpcError } = await authService.authenticate(normalizedEmail, data.password || '');

            if (rpcError) return { user: null, sessionId: null, error: 'Authentication service unavailable' };

            const result = rawData as { success: boolean, user: User, session_id: string, error?: string };
            if (!result.success) {
              return { user: null, sessionId: null, error: result.error };
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
                maxAge: 60 * 60 * 24 * 7 // 1 week
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
              return { user: null, sessionId: null, error: validation.errors[0].message };
            }

            const { data: rawData, error: rpcError } = await authService.register({
              full_name: normalizeInput(data.full_name),
              email: normalizeEmail(data.email),
              password: data.password || '',
              phone: data.phone ? normalizeInput(data.phone) : undefined,
              role: data.role || USER_ROLES.STUDENT
            });

            if (rpcError) return { user: null, sessionId: null, error: 'Signup service unavailable' };

            const result = rawData as { success: boolean, user: User, session_id: string, error?: string };
            if (!result.success) return { user: null, sessionId: null, error: result.error };

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
                maxAge: 60 * 60 * 24 * 7 // 1 week
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
            if (!user) throw new Error('Unauthorized');
            const updated = await authService.updateUserProfile(user, user.id, data, user.sessionId!);
            return UserMapper.toDTO(updated);
        }
        case 'password': {
            if (!user) throw new Error('Unauthorized');
            return await authService.updatePassword(data.currentPassword, data.newPassword, user.sessionId!);
        }
        case 'reset-request': {
            if (data.subAction === 'request') {
                return await authService.requestPasswordReset(data.email, data.reason, data.riskLevel);
            }
            if (!user) throw new Error('Unauthorized');
            if (data.subAction === 'approve') {
                return await authService.approvePasswordReset(data.userId, data.tempPassword, user.sessionId!);
            } else {
                return await authService.denyPasswordReset(data.userId, data.reason, user.sessionId!);
            }
        }
        case 'preferences': {
            if (!user) throw new Error('Unauthorized');
            return await authService.updatePreferences(data.preferences, user.sessionId!);
        }
        default:
            throw new Error('Invalid POST action');
    }
}, { requireAuth: false });
