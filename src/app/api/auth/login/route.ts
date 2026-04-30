import { withHandler } from '@/app/api/api-utils';
import { authController } from '@/lib/controllers/auth.controller';

export const POST = withHandler(async (_user, request) => {
    const body = await request.json();
    const result = await authController.login(body);

    if (result.sessionId) {
        const { createSession } = await import('@/lib/crypto');
        const token = await createSession({
            id: result.user?.id,
            role: result.user?.role,
            sessionId: result.sessionId
        });

        const { cookies } = await import('next/headers');
        (await cookies()).set('app-user-session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
    }

    return result;
}, { requireAuth: false });
