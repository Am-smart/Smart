import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { Enrollment, User } from '../types';

export class EnrollmentService {
  private enrollmentRepo = new EnrollmentRepository();

  async enrollInCourse(studentId: string, courseId: string, sessionId: string): Promise<Enrollment> {
    return this.enrollmentRepo.upsert({
      course_id: courseId,
      student_id: studentId,
      enrolled_at: new Date().toISOString()
    }, sessionId);
  }

  async getStudentEnrollments(studentId: string, sessionId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.findByStudentId(studentId, sessionId);
  }

  async getCourseEnrollments(currentUser: User, courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    return this.enrollmentRepo.findByCourseIds(courseIds, sessionId);
  }

  async removeEnrollment(currentUser: User, courseId: string, studentId: string, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    await this.enrollmentRepo.delete(courseId, studentId, sessionId);
  }
}

export const enrollmentService = new EnrollmentService();
