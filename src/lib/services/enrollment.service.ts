import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { Enrollment, User } from '../types';
import { EnrollmentDomain } from '../domain/enrollment.domain';
import { UserDomain } from '../domain/user.domain';

export class EnrollmentService {
  private enrollmentRepo = new EnrollmentRepository();

  async enrollInCourse(studentId: string, courseId: string, sessionId: string): Promise<Enrollment> {
    const enrollmentToSave = EnrollmentDomain.create(studentId, courseId);
    return this.enrollmentRepo.upsert(enrollmentToSave, sessionId);
  }

  async getStudentEnrollments(studentId: string, sessionId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.findByStudentId(studentId, sessionId);
  }

  async getCourseEnrollments(currentUser: User, courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    if (!UserDomain.canManageContent(currentUser)) throw new Error('Forbidden');
    return this.enrollmentRepo.findByCourseIds(courseIds, sessionId);
  }

  async removeEnrollment(currentUser: User, courseId: string, studentId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageContent(currentUser)) throw new Error('Forbidden');
    await this.enrollmentRepo.delete(courseId, studentId, sessionId);
  }
}

export const enrollmentService = new EnrollmentService();
