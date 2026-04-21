import { supabase } from '../supabase';
import { Session } from '../types';

export class SessionRepository {
  async findById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Session;
  }

  async create(userId: string, expiresAt: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Session;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async findAll(sessionId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .setHeader('x-session-id', sessionId);

    if (error) throw new Error(error.message);
    return data as Session[];
  }
}
