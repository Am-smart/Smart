import { authDb } from '../database/auth.db';
import { systemDb } from '../database/system.db';
import { User } from '../types';
import { UserDomain } from '../domain/user.domain';

export class AuthService {
  async validateSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const session = await authDb.findSessionById(sessionId);
    if (!session || new Date(session.expires_at) < new Date()) {
      return null;
    }
    const user = await systemDb.findUserById(session.user_id);
    if (!user) return null;
    return { id: user.id, sessionId: session.id, email: user.email, role: user.role, full_name: user.full_name };
  }

  async createSession(userId: string): Promise<string> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session = await authDb.createSession(userId, expiresAt);
    return session.id;
  }

  async logout(sessionId: string): Promise<void> {
    await authDb.deleteSession(sessionId);
  }

  async authenticate(email: string, password?: string) {
    return authDb.authenticate(email, password);
  }

  async register(data: { full_name: string; email: string; password?: string; phone?: string; role: string }) {
    return authDb.register(data);
  }

  async updatePassword(currentPass: string, newPass: string, sessionId: string) {
    return authDb.updatePassword(currentPass, newPass, sessionId);
  }

  async requestPasswordReset(email: string, reason: string, riskLevel: string) {
    return authDb.requestPasswordReset(email, reason, riskLevel);
  }

  async approvePasswordReset(userId: string, tempPassword: string, sessionId: string) {
    return authDb.approvePasswordReset(userId, tempPassword, sessionId);
  }

  async denyPasswordReset(userId: string, reason: string, sessionId: string) {
    return authDb.denyPasswordReset(userId, reason, sessionId);
  }

  async updatePreferences(preferences: object, sessionId: string) {
    return authDb.updatePreferences(preferences, sessionId);
  }

  // Merged from UserService
  async getCurrentUser(id: string, sessionId: string): Promise<User> {
    const user = await systemDb.findUserById(id, sessionId);
    if (!user) throw new Error('User not found');

    return { ...user, sessionId };
  }

  async getAllUsers(currentUser: User, sessionId: string): Promise<User[]> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    return systemDb.findAllUsers(sessionId);
  }

  async updateUserProfile(currentUser: User, userId: string, updates: Partial<User>, sessionId: string): Promise<User> {
    const targetUser = await systemDb.findUserById(userId, sessionId);
    if (!targetUser) throw new Error('User not found');

    UserDomain.validateUpdate(currentUser, userId);

    const filteredUpdates = UserDomain.filterUpdateFields(currentUser, updates);

    return systemDb.updateUser(userId, filteredUpdates, sessionId, targetUser.version);
  }

  async toggleUserStatus(currentUser: User, userId: string, active: boolean, sessionId: string): Promise<void> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    await systemDb.updateUser(userId, { active }, sessionId);
  }

  async deleteUser(currentUser: User, userId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    await systemDb.deleteUser(userId, sessionId);
  }
}

export const authService = new AuthService();
