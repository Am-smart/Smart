import { User } from '../types';

export class UserDomain {
  static validateUpdate(currentUser: User, targetUserId: string): void {
    if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
      throw new Error('Forbidden');
    }
  }

  static isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  static isTeacher(user: User): boolean {
    return user.role === 'teacher';
  }

  static canManageUsers(user: User): boolean {
    return this.isAdmin(user);
  }

  static canManageContent(user: User): boolean {
    return this.isAdmin(user) || this.isTeacher(user);
  }

  static filterUpdateFields(currentUser: User, updates: Partial<User>): Partial<User> {
    if (this.isAdmin(currentUser)) {
      return updates;
    }

    const allowedFields: Array<keyof User> = ['full_name', 'phone', 'notification_preferences', 'metadata'];
    const filteredUpdates: Partial<User> = {};
    allowedFields.forEach(field => {
      if (field in updates) {
        (filteredUpdates as Record<string, unknown>)[field as string] = updates[field];
      }
    });
    return filteredUpdates;
  }
}
