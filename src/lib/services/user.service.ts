import { UserRepository } from '../repositories/user.repository';
import { User } from '../types';
import { rbac } from '../auth/rbac';

export class UserService {
  private userRepo = new UserRepository();

  async getCurrentUser(id: string, sessionId: string): Promise<User> {
    const user = await this.userRepo.findById(id, sessionId);
    if (!user) throw new Error('User not found');
    return { ...user, sessionId };
  }

  async getAllUsers(currentUser: User, sessionId: string): Promise<User[]> {
    if (!rbac.can(currentUser, 'user:manage')) throw new Error('Forbidden');
    return this.userRepo.findAll(sessionId);
  }

  async updateUserProfile(currentUser: User, userId: string, updates: Partial<User>, sessionId: string): Promise<User> {
    const targetUser = await this.userRepo.findById(userId, sessionId);
    if (!targetUser) throw new Error('User not found');

    if (!rbac.isOwner(currentUser, { user_id: userId }) && !rbac.can(currentUser, 'user:manage')) {
      throw new Error('Forbidden');
    }

    // Standard user profile update (limited fields if not admin)
    if (currentUser.role !== 'admin') {
      const allowedFields: Array<keyof User> = ['full_name', 'phone', 'notification_preferences', 'metadata'];
      const filteredUpdates: Partial<User> = {};
      allowedFields.forEach(field => {
        if (field in updates) {
          (filteredUpdates as Record<string, unknown>)[field as string] = updates[field];
        }
      });
      return this.userRepo.update(userId, filteredUpdates, sessionId, targetUser.version);
    }

    return this.userRepo.update(userId, updates, sessionId, targetUser.version);
  }

  async toggleUserStatus(currentUser: User, userId: string, active: boolean, sessionId: string): Promise<void> {
    if (!rbac.can(currentUser, 'user:manage')) throw new Error('Forbidden');
    await this.userRepo.update(userId, { active }, sessionId);
  }

  async deleteUser(currentUser: User, userId: string, sessionId: string): Promise<void> {
    if (!rbac.can(currentUser, 'user:manage')) throw new Error('Forbidden');
    await this.userRepo.delete(userId, sessionId);
  }
}

export const userService = new UserService();
