import { supabase, withSession } from '../supabase';

export class AttendanceRepository {
  async upsert(attendance: { live_class_id: string, student_id: string, join_time: string, is_present: boolean }, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('attendance'), sessionId)
      .upsert(attendance, { onConflict: 'live_class_id, student_id' });

    if (error) throw new Error(error.message);
  }
}
