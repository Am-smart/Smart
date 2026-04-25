import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { authService } from '@/lib/services/auth.service';

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const preferences = await request.json();
        const result = await authService.updatePreferences(preferences, user.sessionId!);
        return NextResponse.json(result);
    } catch (error: unknown) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
