import { LessonRepository } from '../repositories/lesson.repository';
import { MaterialRepository } from '../repositories/material.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { StudySessionRepository } from '../repositories/study-session.repository';
import { UserRepository } from '../repositories/user.repository';
import { Lesson, Material, User, StudySession, LessonCompletion } from '../types';
import { rbac } from '../auth/rbac';

export class LearningService {
  private lessonRepo = new LessonRepository();
  private materialRepo = new MaterialRepository();
  private enrollmentRepo = new EnrollmentRepository();
  private studyRepo = new StudySessionRepository();
  private userRepo = new UserRepository();

  // Lessons
  async getLessons(courseId: string, sessionId: string): Promise<Lesson[]> {
    return this.lessonRepo.findByCourseId(courseId, sessionId);
  }

  async saveLesson(currentUser: User, lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
    if (!rbac.can(currentUser, 'lesson:manage')) throw new Error('Forbidden');
    if (!lesson.title) throw new Error('Lesson title is required');
    if (!lesson.course_id) throw new Error('Course ID is required');

    return this.lessonRepo.upsert(lesson, sessionId);
  }

  async deleteLesson(currentUser: User, lessonId: string, sessionId: string): Promise<void> {
    if (!rbac.can(currentUser, 'lesson:manage')) throw new Error('Forbidden');
    await this.lessonRepo.delete(lessonId, sessionId);
  }

  async markLessonComplete(studentId: string, lessonId: string, courseId: string, sessionId: string): Promise<{ success: boolean, progress: number }> {
    await this.lessonRepo.markComplete(studentId, lessonId, sessionId);

    // Recalculate progress
    const allLessons = await this.lessonRepo.findByCourseId(courseId, sessionId);
    const lessonIds = allLessons.map(l => l.id);
    if (lessonIds.length === 0) return { success: true, progress: 0 };

    const completedIds = await this.lessonRepo.findCompletions(studentId, lessonIds, sessionId);
    const progress = Math.round((completedIds.length / lessonIds.length) * 100);

    await this.enrollmentRepo.updateProgress(courseId, studentId, progress, progress === 100, sessionId);

    return { success: true, progress };
  }

  // Materials
  async getMaterials(courseId?: string, sessionId?: string): Promise<Material[]> {
    if (courseId && sessionId) {
        return this.materialRepo.findByCourseId(courseId, sessionId);
    }
    return [];
  }

  async saveMaterial(currentUser: User, material: Partial<Material>, sessionId: string): Promise<Material> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    return this.materialRepo.upsert(material, sessionId);
  }

  async deleteMaterial(currentUser: User, materialId: string, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    await this.materialRepo.delete(materialId, sessionId);
  }

  async saveStudySession(userId: string, session: Partial<StudySession>, xpEarned: number, sessionId: string): Promise<void> {
    await this.studyRepo.create({ ...session, user_id: userId }, sessionId);

    if (xpEarned > 0) {
        const user = await this.userRepo.findById(userId, sessionId);
        if (user) {
            const newXp = (user.xp || 0) + xpEarned;
            const newLevel = Math.floor(newXp / 1000) + 1;
            await this.userRepo.update(userId, { xp: newXp, level: newLevel }, sessionId, user.version);
        }
    }
  }

  async getLessonCompletions(studentId: string, sessionId: string): Promise<string[]> {
    // This is a simplified version, should ideally return LessonCompletion[]
    // For now returning the IDs as expected by the caller
    const { supabase, withSession } = await import('../supabase');
    const { data, error } = await withSession(supabase.from('lesson_completions'), sessionId)
        .select('lesson_id')
        .eq('student_id', studentId);

    if (error) throw new Error(error.message);
    return data.map(d => d.lesson_id);
  }
}

export const learningService = new LearningService();
