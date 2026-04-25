import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '../api-utils';
import { SessionRepository } from '@/lib/repositories/session.repository';

export async function GET() {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const repo = new SessionRepository();
        const sessions = await repo.findAll(user.sessionId!);
        return NextResponse.json(sessions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
