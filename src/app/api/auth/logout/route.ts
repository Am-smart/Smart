import { withHandler } from '@/app/api/api-utils';

export const POST = withHandler(async () => {
    const { cookies } = await import('next/headers');
    (await cookies()).delete('app-user-session');
    return { success: true };
}, { requireAuth: false });
