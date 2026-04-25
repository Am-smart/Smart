import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { gamificationService } from '@/lib/services/gamification.service';

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const body = await request.json();
        await gamificationService.assignBadge(user, body, user.sessionId!);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
