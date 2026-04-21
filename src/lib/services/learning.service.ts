/* eslint-disable @typescript-eslint/no-explicit-any */
import { LessonRepository } from '../repositories/lesson.repository';
import { MaterialRepository } from '../repositories/material.repository';
import { StudySessionRepository } from '../repositories/study-session.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { Lesson, Material, User, LessonCompletion } from '../types';
import { LearningDomain } from '../domain/learning.domain';
import { supabase, withSession } from '../supabase';

export class LearningService {
  private lessonRepo = new LessonRepository();
  private materialRepo = new MaterialRepository();
  private studySessionRepo = new StudySessionRepository();
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
    await this.lessonRepo.markComplete(studentId, lessonId, sessionId);

    // Update progress
    const lessons = await this.lessonRepo.findByCourseId(courseId, sessionId);
    const lessonIds = lessons.map(l => l.id);
    const completedIds = await this.lessonRepo.findCompletions(studentId, lessonIds, sessionId);

    const progress = LearningDomain.calculateProgress(completedIds.length, lessonIds.length);

    await this.enrollmentRepo.updateProgress(studentId, courseId, progress, sessionId);

    return { success: true };
  }

  async getLessonCompletions(studentId: string, sessionId: string): Promise<LessonCompletion[]> {
      const data = await this.lessonRepo.getCompletions(studentId, sessionId);
      return data as LessonCompletion[];
  }

  // Study Sessions
  async saveStudySession(userId: string, session: Partial<unknown>, xpEarned: number, sessionId: string): Promise<void> {
    await this.studySessionRepo.create({ ...(session as Record<string, unknown>), user_id: userId } as any, sessionId);
    if (xpEarned > 0) {
      await withSession(supabase.rpc('award_xp', { p_user_id: userId, p_amount: xpEarned }), sessionId);
    }
  }
}

export const learningService = new LearningService();
