import { CourseRepository } from '../repositories/course.repository';
import { Course, User } from '../types';
import { rbac } from '../auth/rbac';
import { CourseDomain } from '../domain/course.domain';

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
    CourseDomain.validate(course);
    const courseToSave = CourseDomain.create(course, currentUser.id, currentUser.full_name);

    return this.courseRepo.upsert(courseToSave, sessionId);
  }

  async deleteCourse(courseId: string, sessionId: string): Promise<void> {
    await this.courseRepo.delete(courseId, sessionId);
  }
}

export const courseService = new CourseService();
