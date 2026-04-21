import { CourseRepository } from '../repositories/course.repository';
import { Course, User } from '../types';
import { rbac } from '../auth/rbac';

export class CourseService {
  private courseRepo = new CourseRepository();

  async getCourses(teacherId?: string, sessionId?: string): Promise<Course[]> {
    return this.courseRepo.findAll(teacherId, sessionId);
  }

  async getCourse(id: string, sessionId: string): Promise<Course> {
    const course = await this.courseRepo.findById(id, sessionId);
    if (!course) throw new Error('Course not found');
    return course;
  }

  async saveCourse(currentUser: User, course: Partial<Course>, sessionId: string): Promise<Course> {
    if (course.id) {
      const existingCourse = await this.courseRepo.findById(course.id, sessionId);
      if (!existingCourse) throw new Error('Course not found');
      if (!rbac.canManageCourse(currentUser, existingCourse)) throw new Error('Forbidden');
    } else {
      if (!rbac.can(currentUser, 'course:create')) throw new Error('Forbidden');
    }

    if (!course.title) throw new Error('Course title is required');

    return this.courseRepo.upsert({
        ...course,
        teacher_id: course.teacher_id || currentUser.id,
        status: course.status || 'draft',
    }, sessionId);
  }

  async deleteCourse(currentUser: User, courseId: string, sessionId: string): Promise<void> {
    const existingCourse = await this.courseRepo.findById(courseId, sessionId);
    if (!existingCourse) throw new Error('Course not found');
    if (!rbac.canManageCourse(currentUser, existingCourse)) throw new Error('Forbidden');

    await this.courseRepo.delete(courseId, sessionId);
  }
}

export const courseService = new CourseService();
