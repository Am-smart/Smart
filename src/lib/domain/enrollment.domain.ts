import { Enrollment, User } from '../types';

export class EnrollmentDomain {
  static validateUnenrollment(currentUser: User, targetStudentId: string) {
    // Teachers/Admins can unenroll anyone, students can only unenroll themselves
    if (currentUser.role === 'student' && currentUser.id !== targetStudentId) {
      throw new Error('Forbidden: You can only unenroll yourself');
    }
  }

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
