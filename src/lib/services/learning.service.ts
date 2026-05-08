import { learningDb } from '../database/learning.db';
import { Course, Lesson, Material, LessonCompletion, User } from '../types';
import { CourseDomain } from '../domain/course.domain';
import { LearningDomain } from '../domain/learning.domain';
import { NotFoundError, ForbiddenError } from '../api-error';

export class LearningService {
  // Courses
  async getCourse(id: string, sessionId: string): Promise<Course> {
    const course = await learningDb.findCourseById(id, sessionId);
    if (!course) throw new NotFoundError('Course not found');
    return course;
  }

  async getCourses(teacherId?: string, sessionId?: string, limit?: number, offset?: number): Promise<Course[]> {
    return learningDb.findAllCourses(teacherId, sessionId!, limit, offset);
  }

  async saveCourse(teacherId: string, teacherName: string, course: Partial<Course>, sessionId: string): Promise<Course> {
    CourseDomain.validate(course);
    const courseToSave = CourseDomain.create(course, teacherId, teacherName);

    // Ensure category is preserved in metadata for backward compatibility if needed
    if (course.category) {
        courseToSave.metadata = {
            ...courseToSave.metadata,
            category: course.category
        };
    }

    return learningDb.upsertCourse(courseToSave, sessionId);
  }

  async deleteCourse(id: string, sessionId: string): Promise<void> {
    await learningDb.deleteCourse(id, sessionId);
  }

  // Lessons
  async getLessons(courseId: string, sessionId: string, userId?: string, userRole?: string): Promise<Lesson[]> {
    if (userRole === 'student' && userId) {
        const enrollment = await learningDb.findEnrollmentByCourseAndStudent(courseId, userId, sessionId);
        if (!enrollment) return [];
    }
    return learningDb.findLessonsByCourseId(courseId, sessionId);
  }

  async saveLesson(lesson: Partial<Lesson>, sessionId: string, currentUser?: User): Promise<Lesson> {
    LearningDomain.validateLesson(lesson);

    if (currentUser && currentUser.role === 'teacher') {
        let courseId = lesson.course_id;
        if (!courseId && lesson.id) {
            const existing = await learningDb.findLessonById(lesson.id, sessionId);
            if (existing) courseId = existing.course_id;
        }

        if (courseId) {
            const course = await learningDb.findCourseById(courseId, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage lessons for your own courses');
            }
        }
    }

    const lessonToSave = LearningDomain.prepareLesson(lesson);
    return learningDb.upsertLesson(lessonToSave, sessionId);
  }

  async deleteLesson(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'teacher') {
        const lesson = await learningDb.findLessonById(id, sessionId);
        if (lesson) {
            const course = await learningDb.findCourseById(lesson.course_id, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage lessons for your own courses');
            }
        }
    }
    await learningDb.deleteLesson(id, sessionId);
  }

  // Materials
  async getMaterials(courseId: string | undefined, sessionId: string, userId?: string, userRole?: string): Promise<Material[]> {
    if (userRole === 'student' && userId) {
        const enrollments = await learningDb.findEnrollmentsByStudentId(userId, sessionId);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const materials = await learningDb.findAllMaterials(courseId, sessionId);
        return materials.filter(m => enrolledCourseIds.includes(m.course_id));
    }

    if (userRole === 'teacher' && userId) {
        return learningDb.findAllMaterials(courseId, sessionId, userId);
    }

    return learningDb.findAllMaterials(courseId, sessionId);
  }

  async saveMaterial(teacherId: string, material: Partial<Material>, sessionId: string, currentUser?: User): Promise<Material> {
    LearningDomain.validateMaterial(material);

    if (currentUser && currentUser.role === 'teacher') {
        let courseId = material.course_id;
        if (!courseId && material.id) {
            const existing = await learningDb.findMaterialById(material.id, sessionId);
            if (existing) courseId = existing.course_id;
        }

        if (courseId) {
            const course = await learningDb.findCourseById(courseId, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage materials for your own courses');
            }
        }
    }

    const materialToSave = LearningDomain.prepareMaterial(material, teacherId);
    return learningDb.upsertMaterial(materialToSave, sessionId);
  }

  async deleteMaterial(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'teacher') {
        const material = await learningDb.findMaterialById(id, sessionId);
        if (material) {
            const course = await learningDb.findCourseById(material.course_id, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage materials for your own courses');
            }
        }
    }
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
