import { supabase, withSession } from '../supabase';
import { Lesson } from '../types';

export class LessonRepository {
  async findById(id: string, sessionId: string): Promise<Lesson | null> {
    const { data, error } = await withSession(supabase.from('lessons').select('*').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Lesson;
  }

  async findByCourseId(courseId: string, sessionId: string): Promise<Lesson[]> {
    const { data, error } = await withSession(supabase.from('lessons'), sessionId)
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw new Error(error.message);
    return data as Lesson[];
  }

  async upsert(lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
    const { version, id, ...lessonData } = lesson;

    let query = withSession(supabase.from('lessons'), sessionId)
      .upsert({
        ...lessonData,
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
        throw new Error('Conflict detected: Lesson has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Lesson;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('lessons'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async markComplete(studentId: string, lessonId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('lesson_completions'), sessionId)
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_id, lesson_id' });

    if (error) throw new Error(error.message);
  }

  async findCompletions(studentId: string, lessonIds: string[], sessionId: string): Promise<string[]> {
    const { data, error } = await withSession(supabase.from('lesson_completions'), sessionId)
        .select('lesson_id')
        .eq('student_id', studentId)
        .in('lesson_id', lessonIds);

    if (error) throw new Error(error.message);
    return data?.map(c => c.lesson_id) || [];
  }
}
