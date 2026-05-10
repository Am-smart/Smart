import { withSession, supabase } from '../supabase';
import { adminClient } from '../supabase-admin';
import { Session } from '../types';
import { dbUtils } from './db-utils';

export const authDb = {
  async register(data: { full_name: string; email: string; password?: string; phone?: string; role: string; active?: boolean }): Promise<{ data: unknown, error: unknown }> {
    const client = adminClient || supabase;
    const { data: userData, error } = await client.from('users').insert(data).select().single();
    return { data: userData, error };
  },

  async updateUserRaw(id: string, updates: Partial<any>, sessionId?: string): Promise<{ data: unknown, error: unknown }> {
    const client = adminClient || supabase;
    let query = client.from('users').update(updates).eq('id', id);
    if (sessionId && !adminClient) query = withSession(query, sessionId);
    const { data, error } = await query.select().single();
    return { data, error };
  },

  // Session Table Operations (Original SessionRepository)
  async findSessionByHash(tokenHash: string): Promise<Session | null> {
    const client = adminClient || supabase;
    const { data, error } = await client
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
    const client = adminClient || supabase;
    const { data, error } = await client
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
    const client = adminClient || supabase;
    const { error } = await client
      .from('sessions')
      .delete()
      .eq('token_hash', tokenHash);

    if (error) dbUtils.handleError(error);
  },

  async deleteUserSessions(userId: string, exceptHash?: string): Promise<void> {
    const client = adminClient || supabase;
    let query = client.from('sessions').delete().eq('user_id', userId);
    if (exceptHash) {
      query = query.neq('token_hash', exceptHash);
    }
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async findAllSessions(sessionId: string, userId?: string): Promise<Session[]> {
    const client = adminClient || supabase;
    let query = client.from('sessions').select('*');
    if (sessionId && !adminClient) query = withSession(query, sessionId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Session[];
  }
};
