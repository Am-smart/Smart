import { learningDb } from '../database/learning.db';
import { Course, Lesson, Material, LessonCompletion } from '../types';
import { CourseDomain } from '../domain/course.domain';
import { LearningDomain } from '../domain/learning.domain';
import { NotFoundError } from '../api-error';

export class LearningService {
  // Courses
  async getCourse(id: string, sessionId: string): Promise<Course> {
    const course = await learningDb.findCourseById(id, sessionId);
    if (!course) throw new NotFoundError('Course not found');
    return course;
  }

  async saveCourse(teacherId: string, teacherName: string, course: Partial<Course>, sessionId: string): Promise<Course> {
    CourseDomain.validate(course);
    const courseToSave = CourseDomain.create(course, teacherId, teacherName);
    return learningDb.upsertCourse(courseToSave, sessionId);
  }

  // Lessons

  async saveLesson(lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
    const lessonToSave = LearningDomain.prepareLesson(lesson);
    return learningDb.upsertLesson(lessonToSave, sessionId);
  }

  // Materials

  async saveMaterial(teacherId: string, material: Partial<Material>, sessionId: string): Promise<Material> {
    const materialToSave = LearningDomain.prepareMaterial(material, teacherId);
    return learningDb.upsertMaterial(materialToSave, sessionId);
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
