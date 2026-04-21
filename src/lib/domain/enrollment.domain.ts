import { Enrollment } from '../types';

export class EnrollmentDomain {
  static create(studentId: string, courseId: string): Partial<Enrollment> {
    return {
      course_id: courseId,
      student_id: studentId,
      enrolled_at: new Date().toISOString(),
      progress: 0,
      completed: false
    };
  }
}
