import { LessonRepository } from '../repositories/lesson.repository';
import { MaterialRepository } from '../repositories/material.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { Lesson, Material, User, LessonCompletion } from '../types';
import { LearningDomain } from '../domain/learning.domain';
import { withSession } from '../supabase';
import { supabaseServer as supabase } from '../supabase-server';

export class LearningService {
  private lessonRepo = new LessonRepository();
  private materialRepo = new MaterialRepository();
  private enrollmentRepo = new EnrollmentRepository();

  // Lessons
  async getLessons(courseId: string, sessionId: string): Promise<Lesson[]> {
    return this.lessonRepo.findByCourseId(courseId, sessionId);
  }

  async saveLesson(lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
    const lessonToSave = LearningDomain.prepareLesson(lesson);
    return this.lessonRepo.upsert(lessonToSave, sessionId);
  }

  async deleteLesson(lessonId: string, sessionId: string): Promise<void> {
    await this.lessonRepo.delete(lessonId, sessionId);
  }

  // Materials
  async getMaterials(courseId?: string, sessionId?: string): Promise<Material[]> {
    return this.materialRepo.findAll(courseId, sessionId);
  }

  async saveMaterial(currentUser: User, material: Partial<Material>, sessionId: string): Promise<Material> {
    const materialToSave = LearningDomain.prepareMaterial(material, currentUser.id);
    return this.materialRepo.upsert(materialToSave, sessionId);
  }

  async deleteMaterial(id: string, sessionId: string): Promise<void> {
    await this.materialRepo.delete(id, sessionId);
  }

  // Progress
  async markLessonComplete(studentId: string, lessonId: string, courseId: string, sessionId: string): Promise<{ success: boolean }> {
    const { error } = await withSession(supabase.from('lesson_completions').upsert({
      student_id: studentId,
      lesson_id: lessonId
    }), sessionId);

    if (error) throw new Error((error as Error).message);

    // Update progress
    const { data: lessons } = await withSession(supabase.from('lessons').select('id').eq('course_id', courseId), sessionId);
    const { data: completed } = await withSession(supabase.from('lesson_completions').select('lesson_id').eq('student_id', studentId).in('lesson_id', lessons?.map(l => l.id) || []), sessionId);

    const progress = Math.round(((completed?.length || 0) / (lessons?.length || 1)) * 100);
    await withSession(supabase.from('enrollments').update({ progress, completed: progress === 100 }).eq('course_id', courseId).eq('student_id', studentId), sessionId);

    return { success: true };
  }

  async getLessonCompletions(studentId: string, sessionId: string): Promise<LessonCompletion[]> {
      const { data, error } = await withSession(supabase.from('lesson_completions').select('*').eq('student_id', studentId), sessionId);
      if (error) throw new Error((error as Error).message);
      return data as LessonCompletion[];
  }
}

export const learningService = new LearningService();
