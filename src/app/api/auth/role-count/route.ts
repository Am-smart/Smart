import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase-server';

export async function GET() {
    try {
        const [teachers, admins, total] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
            supabase.from('users').select('*', { count: 'exact', head: true })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                teachers: teachers.count || 0,
                admins: admins.count || 0,
                total: total.count || 0
            }
        });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
