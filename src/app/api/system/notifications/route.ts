import { NextResponse } from 'next/server';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { communicationService } from '@/lib/services/communication.service';

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const params = await request.json();
        const result = await communicationService.notifyUser(params, user.sessionId!);
        return NextResponse.json(result);
    } catch (error: unknown) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
