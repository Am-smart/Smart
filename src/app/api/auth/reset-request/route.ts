import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSessionUser, handleUnauthorized } from '@/app/api/api-utils';
import { authService } from '@/lib/services/auth.service';

export async function POST(request: Request) {
    const user = await getSessionUser();
    if (!user) return handleUnauthorized();

    try {
        const { userId, tempPassword, action } = await request.json();
        let result;
        if (action === 'approve') {
            result = await authService.approvePasswordReset(userId, tempPassword, user.sessionId!);
        } else {
            result = await authService.denyPasswordReset(userId, tempPassword, user.sessionId!); // tempPassword is reason here
        }
        return NextResponse.json(result);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
