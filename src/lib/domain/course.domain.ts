import { Course } from '../types';

export class CourseDomain {
  static create(data: Partial<Course>, teacherId: string): Partial<Course> {
    return {
      ...data,
      teacher_id: data.teacher_id || teacherId,
      status: data.status || 'draft',
    };
  }

  static validate(course: Partial<Course>): void {
    if (!course.title) {
      throw new Error('Course title is required');
    }
  }
}
