import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';
import { Course, Lesson, Material, Enrollment } from '../types';

export const learningDb = {
  // Course Operations
  async findCourseById(id: string, sessionId?: string): Promise<Course | null> {
    const query = withSession(supabase.from('courses').select('*').eq('id', id), sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return data as Course;
  },

  async findAllCourses(teacherId?: string, sessionId?: string): Promise<Course[]> {
    let query = withSession(supabase.from('courses').select('*'), sessionId);
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Course[];
  },

  async upsertCourse(course: Partial<Course>, sessionId: string): Promise<Course> {
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
  },

  async deleteCourse(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('courses'), sessionId)
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Lesson Operations
  async findLessonById(id: string, sessionId: string): Promise<Lesson | null> {
    const { data, error } = await withSession(supabase.from('lessons').select('*').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Lesson;
  },

  async findLessonsByCourseId(courseId: string, sessionId: string): Promise<Lesson[]> {
    const { data, error } = await withSession(supabase.from('lessons'), sessionId)
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return data as Lesson[];
  },

  async upsertLesson(lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
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
  },

  async deleteLesson(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('lessons'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async markLessonComplete(studentId: string, lessonId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('lesson_completions'), sessionId)
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_id, lesson_id' });
    if (error) throw new Error(error.message);
  },

  async findLessonCompletions(studentId: string, lessonIds: string[], sessionId: string): Promise<string[]> {
    const { data, error } = await withSession(supabase.from('lesson_completions'), sessionId)
        .select('lesson_id')
        .eq('student_id', studentId)
        .in('lesson_id', lessonIds);
    if (error) throw new Error(error.message);
    return data?.map(c => c.lesson_id) || [];
  },

  async getLessonCompletions(studentId: string, sessionId: string): Promise<unknown[]> {
    const { data, error } = await withSession(supabase.from('lesson_completions').select('*').eq('student_id', studentId), sessionId);
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Material Operations
  async findMaterialById(id: string, sessionId: string): Promise<Material | null> {
    const { data, error } = await withSession(supabase.from('materials').select('*').eq('id', id), sessionId).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Material;
  },

  async findAllMaterials(courseId?: string, sessionId?: string): Promise<Material[]> {
    let query = withSession(supabase.from('materials').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Material[];
  },

  async upsertMaterial(material: Partial<Material>, sessionId: string): Promise<Material> {
    const { version, id, ...materialData } = material;
    let query = withSession(supabase.from('materials'), sessionId)
      .upsert({
        ...materialData,
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
        throw new Error('Conflict detected: Material has been updated by another user.');
      }
      throw new Error(error.message);
    }
    return data as Material;
  },

  async deleteMaterial(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('materials'), sessionId).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Enrollment Operations
  async findEnrollmentsByStudentId(studentId: string, sessionId: string): Promise<Enrollment[]> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*, courses(*), users!student_id(*)')
      .eq('student_id', studentId);
    if (error) throw new Error(error.message);
    return data as Enrollment[];
  },

  async findEnrollmentsByCourseIds(courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*, courses(*), users!student_id(*)')
      .in('course_id', courseIds);
    if (error) throw new Error(error.message);
    return data as Enrollment[];
  },

  async findEnrollmentByCourseAndStudent(courseId: string, studentId: string, sessionId: string): Promise<Enrollment | null> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Enrollment;
  },

  async upsertEnrollment(enrollment: Partial<Enrollment>, sessionId: string): Promise<Enrollment> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .upsert(enrollment)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Enrollment;
  },

  async updateEnrollmentProgress(studentId: string, courseId: string, progress: number, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('enrollments'), sessionId)
      .update({ progress, completed: progress === 100 })
      .eq('course_id', courseId)
      .eq('student_id', studentId);
    if (error) throw new Error(error.message);
  },

  async deleteEnrollment(courseId: string, studentId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('enrollments'), sessionId)
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);
    if (error) throw new Error(error.message);
  }
};
