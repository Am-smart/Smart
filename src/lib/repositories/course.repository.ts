import { supabase, withSession } from '../supabase';
import { Course } from '../types';

export class CourseRepository {
  async findById(id: string, sessionId?: string): Promise<Course | null> {
    let query = supabase.from('courses').select('*').eq('id', id);
    if (sessionId) {
      query = withSession(query, sessionId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return data as Course;
  }

  async findAll(teacherId?: string, sessionId?: string): Promise<Course[]> {
    let query = supabase.from('courses').select('*');
    if (sessionId) {
      query = withSession(query, sessionId);
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Course[];
  }

  async upsert(course: Partial<Course>, sessionId: string): Promise<Course> {
    const { version, id, ...courseData } = course;

    let query = withSession(supabase.from('courses'), sessionId)
      .upsert({
        ...courseData,
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
        throw new Error('Conflict detected: Course has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Course;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('courses'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
