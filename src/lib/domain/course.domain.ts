import { Course } from '../types';

export class CourseDomain {
  static create(data: Partial<Course>, teacherId: string, teacherName?: string): Partial<Course> {
    return {
      ...data,
      teacher_id: data.teacher_id || teacherId,
      created_by: data.created_by || teacherName,
      status: data.status || 'draft',
    };
  }

  static validate(course: Partial<Course>): void {
    if (!course.title) {
      throw new Error('Course title is required');
    }
  }
}
