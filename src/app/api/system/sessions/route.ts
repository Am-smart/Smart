import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { authDb } from '@/lib/database/auth.db';

export async function GET() {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const sessions = await authDb.findAllSessions(user.sessionId!);
        return NextResponse.json(sessions);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
