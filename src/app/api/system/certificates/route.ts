import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { gamificationService } from '@/lib/services/gamification.service';

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const body = await request.json();
        const result = await gamificationService.issueCertificate(user, body, user.sessionId!);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
