import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';
import { Discussion } from '../types';

export class DiscussionRepository {
  async findByCourseId(courseId: string, sessionId: string): Promise<Discussion[]> {
    const { data, error } = await withSession(supabase.from('discussions'), sessionId)
      .select('*, users(full_name, email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw new Error((error as Error).message);
    return data as Discussion[];
  }

  async upsert(post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    const { version, id, ...postData } = post;

    let query = withSession(supabase.from('discussions'), sessionId)
      .upsert({
        ...postData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: (version || 0) + 1
      });

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Discussion post has been updated by another user.');
      }
      throw new Error((error as Error).message);
    }
    return data as Discussion;
  }

  async delete(id: string, userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('discussions'), sessionId)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error((error as Error).message);
  }
}
