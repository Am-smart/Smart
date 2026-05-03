import { learningDb } from '../database/learning.db';
import { Course, Lesson, Material, User, LessonCompletion } from '../types';
import { CourseDomain } from '../domain/course.domain';
import { LearningDomain } from '../domain/learning.domain';

export class LearningService {
  // Courses
  async getCourses(teacherId?: string, sessionId?: string): Promise<Course[]> {
    return learningDb.findAllCourses(teacherId, sessionId);
  }

  async getCourse(id: string, sessionId: string): Promise<Course> {
    const course = await learningDb.findCourseById(id, sessionId);
    if (!course) throw new Error('Course not found');
    return course;
  }

  async saveCourse(currentUser: User, course: Partial<Course>, sessionId: string): Promise<Course> {
    CourseDomain.validate(course);
    const courseToSave = CourseDomain.create(course, currentUser.id, currentUser.full_name);
    return learningDb.upsertCourse(courseToSave, sessionId);
  }

  async deleteCourse(courseId: string, sessionId: string): Promise<void> {
    await learningDb.deleteCourse(courseId, sessionId);
  }

  // Lessons
  async getLessons(courseId: string, sessionId: string): Promise<Lesson[]> {
    return learningDb.findLessonsByCourseId(courseId, sessionId);
  }

  async saveLesson(lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
    const lessonToSave = LearningDomain.prepareLesson(lesson);
    return learningDb.upsertLesson(lessonToSave, sessionId);
  }

  async deleteLesson(lessonId: string, sessionId: string): Promise<void> {
    await learningDb.deleteLesson(lessonId, sessionId);
  }

  // Materials
  async getMaterials(courseId?: string, sessionId?: string): Promise<Material[]> {
    return learningDb.findAllMaterials(courseId, sessionId);
  }

  async saveMaterial(currentUser: User, material: Partial<Material>, sessionId: string): Promise<Material> {
    const materialToSave = LearningDomain.prepareMaterial(material, currentUser.id);
    return learningDb.upsertMaterial(materialToSave, sessionId);
  }

  async deleteMaterial(id: string, sessionId: string): Promise<void> {
    await learningDb.deleteMaterial(id, sessionId);
  }

  // Progress & Completions
  async markLessonComplete(studentId: string, lessonId: string, courseId: string, sessionId: string): Promise<{ success: boolean }> {
    await learningDb.markLessonComplete(studentId, lessonId, sessionId);

    // Update progress
    const lessons = await learningDb.findLessonsByCourseId(courseId, sessionId);
    const lessonIds = lessons.map(l => l.id);
    const completedIds = await learningDb.findLessonCompletions(studentId, lessonIds, sessionId);

    const progress = Math.round(((completedIds.length || 0) / (lessons.length || 1)) * 100);
    await learningDb.updateEnrollmentProgress(studentId, courseId, progress, sessionId);

    return { success: true };
  }

  async getLessonCompletions(studentId: string, sessionId: string): Promise<LessonCompletion[]> {
    return (await learningDb.getLessonCompletions(studentId, sessionId)) as LessonCompletion[];
  }
}

export const learningService = new LearningService();
