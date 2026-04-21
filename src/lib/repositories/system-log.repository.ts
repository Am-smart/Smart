import { supabase, withSession } from '../supabase';
import { SystemLog } from '../types';

export class SystemLogRepository {
  async create(log: SystemLog, sessionId?: string): Promise<boolean> {
    const query = supabase.from('system_logs').insert(log);
    const { error } = sessionId ? await withSession(query, sessionId) : await query;

    if (error) {
      console.error('Failed to create system log:', error);
      return false;
    }
    return true;
  }

  async findAll(limit = 100, sessionId: string): Promise<SystemLog[]> {
    const { data, error } = await withSession(supabase.from('system_logs'), sessionId)
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data as SystemLog[];
  }

  async update(id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    const { data, error } = await withSession(supabase.from('system_logs'), sessionId)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SystemLog;
  }
}
