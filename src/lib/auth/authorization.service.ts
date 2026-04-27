import { rbac } from './rbac';
import { User, Course } from '../types';

export class AuthorizationService {
  // Courses
  canManageCourse(user: User, course?: Course): void {
    if (course) {
      if (!rbac.canManageCourse(user, course)) throw new Error('Forbidden');
    } else {
      if (!rbac.can(user, 'course:create')) throw new Error('Forbidden');
    }
  }

  // Assessments
  canManageAssignments(user: User): void {
    if (!rbac.can(user, 'assignment:manage')) throw new Error('Forbidden');
  }

  canGradeSubmission(user: User): void {
    if (!rbac.can(user, 'assignment:grade')) throw new Error('Forbidden');
  }

  canManageQuizzes(user: User): void {
    if (!rbac.can(user, 'quiz:manage')) throw new Error('Forbidden');
  }

  // Users
  canManageUsers(user: User): void {
    if (!rbac.can(user, 'user:manage')) throw new Error('Forbidden');
  }

  canUpdateUser(currentUser: User, targetUserId: string): void {
    if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
      throw new Error('Forbidden');
    }
  }

  // System
  canManageSystem(user: User): void {
    if (!rbac.can(user, 'system:manage')) throw new Error('Forbidden');
  }
}

export const authz = new AuthorizationService();
