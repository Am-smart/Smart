import { supabase, withSession } from '../supabase';
import { StudySession } from '../types';

export class StudySessionRepository {
  async create(session: Partial<StudySession>, sessionId: string): Promise<StudySession> {
    const { data, error } = await withSession(supabase.from('study_sessions'), sessionId)
        .insert([session])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as StudySession;
  }

  async findByUserId(userId: string, sessionId: string): Promise<StudySession[]> {
    const { data, error } = await withSession(supabase.from('study_sessions'), sessionId)
        .select('*')
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data as StudySession[];
  }
}
