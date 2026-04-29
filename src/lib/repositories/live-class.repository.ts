import { supabase, withSession } from '../supabase';
import { LiveClass } from '../types';

export class LiveClassRepository {
  async findById(id: string, sessionId: string): Promise<LiveClass | null> {
    const { data, error } = await withSession(supabase.from('live_classes').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error((error as Error).message);
    return data as LiveClass;
  }

  async findAll(courseId?: string, teacherId?: string, sessionId?: string): Promise<LiveClass[]> {
    let query = supabase.from('live_classes').select('*, courses(*)');
    if (sessionId) {
      query = withSession(query, sessionId);
    }
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw new Error((error as Error).message);
    return data as LiveClass[];
  }

  async upsert(liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    const { version, id, ...liveClassData } = liveClass;
    const cleanedId = id && id.trim() !== "" ? id : undefined;

    let query = withSession(supabase.from('live_classes'), sessionId)
      .upsert({
        ...liveClassData,
        ...(cleanedId ? { id: cleanedId } : {}),
        updated_at: new Date().toISOString(),
        version: (version || 0) + 1
      });

    if (cleanedId && version) {
      query = query.eq('id', cleanedId).eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (cleanedId && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Live class has been updated by another user.');
      }
      throw new Error((error as Error).message);
    }
    return data as LiveClass;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('live_classes'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }
}
