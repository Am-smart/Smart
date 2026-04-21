import { UserRepository } from '../repositories/user.repository';
import { User } from '../types';
import { UserDomain } from '../domain/user.domain';

export class UserService {
  private userRepo = new UserRepository();

  async getCurrentUser(id: string, sessionId: string): Promise<User> {
    const user = await this.userRepo.findById(id, sessionId);
    if (!user) throw new Error('User not found');
    return { ...user, sessionId };
  }

  async getAllUsers(currentUser: User, sessionId: string): Promise<User[]> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    return this.userRepo.findAll(sessionId);
  }

  async updateUserProfile(currentUser: User, userId: string, updates: Partial<User>, sessionId: string): Promise<User> {
    const targetUser = await this.userRepo.findById(userId, sessionId);
    if (!targetUser) throw new Error('User not found');

    UserDomain.validateUpdate(currentUser, userId);

    const filteredUpdates = UserDomain.filterUpdateFields(currentUser, updates);

    return this.userRepo.update(userId, filteredUpdates, sessionId, targetUser.version);
  }

  async toggleUserStatus(currentUser: User, userId: string, active: boolean, sessionId: string): Promise<void> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    await this.userRepo.update(userId, { active }, sessionId);
  }

  async deleteUser(currentUser: User, userId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    await this.userRepo.delete(userId, sessionId);
  }
}

export const userService = new UserService();
