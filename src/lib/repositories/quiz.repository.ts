import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';
import { Quiz } from '../types';

export class QuizRepository {
  async findById(id: string, sessionId: string): Promise<Quiz | null> {
    const { data, error } = await withSession(supabase.from('quizzes').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error((error as Error).message);
    return data as Quiz;
  }

  async findAll(courseId?: string, teacherId?: string, sessionId?: string): Promise<Quiz[]> {
    let query = withSession(supabase.from('quizzes').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw new Error((error as Error).message);
    return data as Quiz[];
  }

  async upsert(quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    const { version, id, courses, ...quizData } = quiz;
    void courses;

    let query = withSession(supabase.from('quizzes'), sessionId)
      .upsert({
        ...quizData,
        ...(id ? { id } : {}),
        updated_at: new Date().toISOString(),
        version: (version || 0) + 1
      } as Record<string, unknown>);

    if (id && version) {
      query = query.eq('id', id).eq('version', version);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (id && version && error.code === 'PGRST116') {
        throw new Error('Conflict detected: Quiz has been updated by another user.');
      }
      throw new Error((error as Error).message);
    }
    return data as Quiz;
  }

  async delete(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('quizzes'), sessionId)
      .delete()
      .eq('id', id);

    if (error) throw new Error((error as Error).message);
  }
}
