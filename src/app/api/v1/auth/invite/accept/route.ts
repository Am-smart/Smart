import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        const invite = await authService.validateInvite(token);

        const inviteSession = {
            inviteId: invite.id,
            type: invite.type,
            email: invite.email,
            role: invite.role
        };

        const cookieStore = await cookies();
        cookieStore.set('app-invite-session', JSON.stringify(inviteSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1 // 1 hour
        });

        // Redirect to landing page with signup flag
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('signup', 'true');

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error('Invite validation failed:', error);
        return NextResponse.redirect(new URL('/?error=invalid_invite', request.url));
    }
}
