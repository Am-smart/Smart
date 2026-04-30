import { UserRepository } from '../repositories/user.repository';
import { User } from '../types';
import { UserDomain } from '../domain/user.domain';
import redis from '../redis';

export class UserService {
  private userRepo = new UserRepository();

  async getCurrentUser(id: string, sessionId: string): Promise<User> {
  const client = redis();
  const cacheKey = `user:${id}:${sessionId}`;
  const cached = client ? await client.get<string>(cacheKey) : null;

  if (cached) {
    return JSON.parse(cached);
  }

  const user = await this.userRepo.findById(id, sessionId);
  if (!user) throw new Error('User not found');

  const userWithSession = { ...user, sessionId };

  // Cache for 5 minutes
  if (client) {
    await client.set(cacheKey, JSON.stringify(userWithSession), { ex: 300 });
  }

  return userWithSession;
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

  const result = await this.userRepo.update(userId, filteredUpdates, sessionId, targetUser.version);

  // Invalidate cache
  const client = redis();
  if (client) {
    await client.del(`user:${userId}:${sessionId}`);
  }

  return result;
  }

  async toggleUserStatus(currentUser: User, userId: string, active: boolean, sessionId: string): Promise<void> {
  if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
  await this.userRepo.update(userId, { active }, sessionId);
  const client = redis();
  if (client) {
    await client.del(`user:${userId}:${sessionId}`);
  }
  }

  async deleteUser(currentUser: User, userId: string, sessionId: string): Promise<void> {
  if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
  await this.userRepo.delete(userId, sessionId);
  const client = redis();
  if (client) {
    await client.del(`user:${userId}:${sessionId}`);
  }
  }
}

export const userService = new UserService();
