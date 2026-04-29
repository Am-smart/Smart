import { supabase, withSession } from '../supabase';
import { User } from '../types';

export class UserRepository {
  async findById(id: string, sessionId?: string): Promise<User | null> {
    const query = supabase.from('users').select('*').eq('id', id).single();
    const { data, error } = sessionId ? await withSession(query, sessionId) : await query;

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error((error as Error).message);
    }
    return data as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error((error as Error).message);
    }
    return data as User;
  }

  async findAll(sessionId: string): Promise<User[]> {
    const { data, error } = await withSession(supabase.from('users').select('*'), sessionId);
    if (error) throw new Error((error as Error).message);
    return data as User[];
  }

  async create(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw new Error((error as Error).message);
    return data as User;
  }

  async update(id: string, updates: Partial<User>, sessionId: string, version?: number): Promise<User> {
    let query = withSession(supabase.from('users'), sessionId)
      .update({
        ...updates,
        version: (version || 1) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (version) {
      query = query.eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: User profile has been updated by another user.');
      }
      throw new Error((error as Error).message);
    }
    return data as User;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('users'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }

  async updateFailedAttempts(id: string, attempts: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ failed_attempts: attempts })
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }

  async lockUser(id: string, lockedUntil: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ locked_until: lockedUntil })
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }

  async updateLastLogin(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString(), failed_attempts: 0, locked_until: null })
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }
}
