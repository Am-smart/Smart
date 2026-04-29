import { supabase, withSession } from '../supabase';
import { Broadcast } from '../types';

export class BroadcastRepository {
  async create(broadcast: Partial<Broadcast>, sessionId: string): Promise<Broadcast> {
    const { data, error } = await withSession(supabase.from('broadcasts'), sessionId)
        .insert([broadcast])
        .select()
        .single();

    if (error) throw new Error((error as Error).message);
    return data as Broadcast;
  }

  async findAll(sessionId: string): Promise<Broadcast[]> {
    const { data, error } = await withSession(supabase.from('broadcasts'), sessionId)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error((error as Error).message);
    return data as Broadcast[];
  }
}
