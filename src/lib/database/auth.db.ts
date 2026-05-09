import { withSession, supabase } from '../supabase';
import { Session } from '../types';
import { dbUtils } from './db-utils';

export const authDb = {
  async register(data: { full_name: string; email: string; password?: string; phone?: string; role: string; active?: boolean }): Promise<{ data: unknown, error: unknown }> {
    const { data: userData, error } = await supabase.from('users').insert(data).select().single();
    return { data: userData, error };
  },

  async updateUserRaw(id: string, updates: Partial<any>, sessionId?: string): Promise<{ data: unknown, error: unknown }> {
    let query = supabase.from('users').update(updates).eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select().single();
    return { data, error };
  },

  // Session Table Operations (Original SessionRepository)
  async findSessionByHash(tokenHash: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      dbUtils.handleError(error);
    }
    return data as Session;
  },

  async createSession(userId: string, expiresAt: string, tokenHash: string): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        expires_at: expiresAt,
        token_hash: tokenHash
      })
      .select()
      .single();

    if (error) dbUtils.handleError(error);
    return data as Session;
  },

  async deleteSessionByHash(tokenHash: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token_hash', tokenHash);

    if (error) dbUtils.handleError(error);
  },

  async deleteUserSessions(userId: string, exceptHash?: string): Promise<void> {
    let query = supabase.from('sessions').delete().eq('user_id', userId);
    if (exceptHash) {
      query = query.neq('token_hash', exceptHash);
    }
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async findAllSessions(sessionId: string, userId?: string): Promise<Session[]> {
    let query = withSession(supabase.from('sessions').select('*'), sessionId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Session[];
  }
};
