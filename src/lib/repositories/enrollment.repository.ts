import { supabase, withSession } from '../supabase';
import { Enrollment } from '../types';

export class EnrollmentRepository {
  async findByStudentId(studentId: string, sessionId: string): Promise<Enrollment[]> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*, courses(*), users!student_id(*)')
      .eq('student_id', studentId);

    if (error) throw new Error((error as Error).message);
    return data as Enrollment[];
  }

  async findByCourseIds(courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*, courses(*), users!student_id(*)')
      .in('course_id', courseIds);

    if (error) throw new Error((error as Error).message);
    return data as Enrollment[];
  }

  async findByCourseAndStudent(courseId: string, studentId: string, sessionId: string): Promise<Enrollment | null> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw new Error((error as Error).message);
    return data as Enrollment;
  }

  async upsert(enrollment: Partial<Enrollment>, sessionId: string): Promise<Enrollment> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .upsert(enrollment)
      .select()
      .single();

    if (error) throw new Error((error as Error).message);
    return data as Enrollment;
  }

  async updateProgress(studentId: string, courseId: string, progress: number, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('enrollments'), sessionId)
      .update({ progress, completed: progress === 100 })
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (error) throw new Error((error as Error).message);
  }

  async delete(courseId: string, studentId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('enrollments'), sessionId)
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (error) throw new Error((error as Error).message);
  }
}
