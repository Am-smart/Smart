import { supabase, withSession } from '../supabase';
import { Notification } from '../types';

export class NotificationRepository {
  async findByUserId(userId: string, sessionId: string): Promise<Notification[]> {
    const { data, error } = await withSession(supabase.from('notifications'), sessionId)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error((error as Error).message);
    return data as Notification[];
  }

  async markAsRead(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId)
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  }

  async markAllAsRead(userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  async create(target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string, sessionId?: string): Promise<void> {
    let query = supabase.rpc('notify_user', {
        target_id,
        n_title,
        n_msg,
        n_link,
        n_type
    });
    if (sessionId) {
        query = withSession(query, sessionId);
    }
    const { error } = await query;
    if (error) throw new Error((error as Error).message);
  }

  async broadcast(params: { n_course_id: string, n_role?: string, n_title: string, n_msg: string, n_link?: string, n_type?: string, n_expires_in?: string }, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase, sessionId).rpc('broadcast_data', params);
    if (error) throw new Error((error as Error).message);
  }
}
