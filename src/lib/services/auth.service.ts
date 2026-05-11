import { authDb } from '../database/auth.db';
import { systemDb } from '../database/system.db';
import { User } from '../types';
import { UserDomain } from '../domain/user.domain';
import { validatePassword } from '../validation';
import { serverSessionCache } from '../auth/server-session';
import { UserMapper } from '../mappers';
import { rbac } from '../auth/rbac';
import { comparePassword, hashPassword, generateToken, hashToken } from '../crypto';
import { USER_ROLES, SIGNUP_LIMITS } from '../constants';
import { BadRequestError } from '../api-error';

export class AuthService {
  async validateSession(token: string): Promise<User | null> {
    const tokenHash = await hashToken(token);

    const cachedUser = serverSessionCache.get(tokenHash);
    if (cachedUser) {
        return { ...cachedUser, sessionId: tokenHash } as User;
    }

    const session = await authDb.findSessionByHash(tokenHash);
    if (!session || new Date(session.expires_at) < new Date()) {
      return null;
    }
    const user = await systemDb.findUserById(session.user_id);
    if (!user) return null;

    const userDTO = UserMapper.toDTO(user);
    if (!userDTO) return null;

    serverSessionCache.set(tokenHash, userDTO);

    return { ...user, sessionId: tokenHash } as User;
  }

  async createSession(userId: string): Promise<string> {
    await authDb.deleteUserSessions(userId);

    const token = generateToken();
    const tokenHash = await hashToken(token);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await authDb.createSession(userId, expiresAt, tokenHash);
    return token;
  }

  async logout(token: string): Promise<void> {
    const tokenHash = await hashToken(token);
    await authDb.deleteSessionByHash(tokenHash);
    serverSessionCache.invalidate(tokenHash);
  }

  async authenticate(email: string, password?: string) {
    const user = await systemDb.findUserByEmail(email);
    if (!user) {
      return { data: { success: false, error: 'Invalid email or password' }, error: null };
    }

    if (!user.active) {
      return { data: { success: false, error: 'Account is deactivated' }, error: null };
    }

    if (user.flagged) {
      return { data: { success: false, error: 'Account is flagged. Please contact support.' }, error: null };
    }

    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      return { data: { success: false, error: `Account locked until ${new Date(user.locked_until).toLocaleTimeString()}` }, error: null };
    }

    if (user.reset_request && user.reset_request.status === 'approved_used') {
       return { data: { success: false, error: 'Your session has expired. You must change your password using the secure prompt provided during your first login.' }, error: null };
    }

    const isPasswordValid = password && user.password && await comparePassword(password, user.password);
    if (!isPasswordValid) {
      if (user.reset_request) {
        const reset = user.reset_request;
        if (reset.status === 'pending') {
          return { data: { success: false, error: 'Your password reset request is under review.' }, error: null };
        } else if (reset.status === 'approved' && reset.expires_at) {
          if (new Date(reset.expires_at) > now) {
            return { data: { success: false, error: `Reset approved. Your temp password is: ${reset.temp_password}` }, error: null };
          }
        } else if (reset.status === 'denied') {
          return { data: { success: false, error: `Reset denied: ${reset.denial_reason}` }, error: null };
        }
      }

      const failedAttempts = (user.failed_attempts || 0) + 1;
      const newLockouts = failedAttempts >= 5 ? (user.lockouts || 0) + 1 : user.lockouts;
      const updates: Record<string, unknown> = {
        failed_attempts: failedAttempts,
        locked_until: failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : user.locked_until,
        lockouts: newLockouts,
        flagged: (newLockouts || 0) >= 3 ? true : user.flagged
      };
      await authDb.updateUserRaw(user.id, updates);

      return { data: { success: false, error: 'Invalid email or password' }, error: null };
    }

    if (user.reset_request && user.reset_request.status === 'approved') {
       const reset = user.reset_request;
       if (reset.expires_at && new Date(reset.expires_at) < now) {
          return { data: { success: false, error: 'Temporary password has expired. Please request a new one.' }, error: null };
       }
       const newResetRequest: NonNullable<User['reset_request']> = { ...reset, status: 'approved_used' };
       delete newResetRequest.temp_password;

       // Use atomic consumption to prevent race conditions
       const consumed = await authDb.consumeTempPassword(user.id, newResetRequest);
       if (!consumed) {
          return { data: { success: false, error: 'Temporary password has already been used or is no longer valid.' }, error: null };
       }
    }

    await authDb.updateUserRaw(user.id, { last_login: now.toISOString(), failed_attempts: 0, locked_until: null });

    // Explicitly create session and get token
    const token = await this.createSession(user.id);

    const { systemService } = await import('./system.service');
    systemService.performSystemCleanup(await hashToken(token)).catch(console.error);

    return {
      data: {
        success: true,
        user: user,
        session_id: token
      },
      error: null
    };
  }

  async signup(data: { full_name: string; email: string; password?: string; phone?: string; role: string }) {
    if (!data.password || data.password.trim() === '') {
      throw new BadRequestError('Password is required');
    }

    const existingUser = await systemDb.findUserByEmail(data.email);
    if (existingUser) {
      return { data: { success: false, error: 'An account with this email already exists.' }, error: null };
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0].message);
    }

    if (data.role === USER_ROLES.TEACHER || data.role === USER_ROLES.ADMIN) {
      const count = await this.getRoleUserCount(data.role);
      const limit = data.role === USER_ROLES.TEACHER ? SIGNUP_LIMITS.TEACHER : SIGNUP_LIMITS.ADMIN;
      if (count >= limit) {
        return { data: { success: false, error: `Public creation limit reached for ${data.role}s.` }, error: null };
      }
    }

    const hashedPassword = await hashPassword(data.password);
    const { data: userData, error } = await authDb.register({
      ...data,
      password: hashedPassword,
      active: true
    });

    if (error) return { data: null, error };

    const newUser = userData as User;

    // Explicitly create session and get token
    const token = await this.createSession(newUser.id);

    return {
      data: {
        success: true,
        user: newUser,
        session_id: token
      },
      error: null
    };
  }

  async createUser(currentUser: User, data: { full_name: string; email: string; password?: string; phone?: string; role: string }): Promise<User | null> {
    if (!rbac.can(currentUser, 'user:manage')) {
        throw new Error('Forbidden: Only admins can create users directly');
    }

    if (!data.password || data.password.trim() === '') {
      throw new BadRequestError('Password is required');
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0].message);
    }

    const hashedPassword = await hashPassword(data.password);
    const { data: userData, error } = await authDb.register({
      ...data,
      password: hashedPassword,
      active: true
    });

    if (error) throw new Error('Failed to create user in database');
    return userData;
  }

  async updatePassword(currentPass: string, newPass: string, token: string) {
    const sessionUser = await this.validateSession(token);
    if (!sessionUser) return { success: false, error: 'Unauthorized' };

    const user = await systemDb.findUserById(sessionUser.id as string, sessionUser.sessionId);
    if (!user) return { success: false, error: 'User not found' };

    const isPasswordValid = user.password && await comparePassword(currentPass, user.password);
    if (!isPasswordValid) return { success: false, error: 'Incorrect current password' };

    const hashedPassword = await hashPassword(newPass);
    await authDb.updateUserRaw(user.id, { password: hashedPassword, reset_request: null }, sessionUser.sessionId);

    await authDb.deleteUserSessions(user.id);

    return { success: true };
  }

  async requestPasswordReset(email: string, reason: string, riskLevel: string) {
    const user = await systemDb.findUserByEmail(email);
    if (!user) return { success: false, error: 'No account found with this email.' };

    if (user.reset_request) {
      const reset = user.reset_request;
      if (reset.status === 'pending') {
        return { success: false, error: 'A request is already under review for this account.' };
      } else if (reset.status === 'approved' && reset.expires_at && new Date(reset.expires_at) > new Date()) {
        return { success: false, error: `Reset approved. Temp Password: ${reset.temp_password}` };
      }
    }

    const resetRequest: NonNullable<User['reset_request']> = {
      requested_at: new Date().toISOString(),
      status: 'pending',
      reason,
      risk_level: riskLevel
    };

    await authDb.updateUserRaw(user.id, {
      reset_request: resetRequest,
      flagged: riskLevel === 'high' ? true : user.flagged
    });

    return { success: true };
  }

  async approvePasswordReset(userId: string, tempPassword: string, currentUser: User) {
    const hashedPassword = await hashPassword(tempPassword);

    const user = await systemDb.findUserById(userId, currentUser.sessionId);
    if (!user) throw new Error('User not found');

    const resetRequest: NonNullable<User['reset_request']> = {
      ...(user.reset_request || { status: 'pending', requested_at: new Date().toISOString() }),
      status: 'approved',
      temp_password: tempPassword,
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await authDb.updateUserRaw(userId, {
      password: hashedPassword,
      reset_request: resetRequest,
      failed_attempts: 0,
      locked_until: null
    }, currentUser.sessionId);

    return { success: true };
  }

  async denyPasswordReset(userId: string, reason: string, currentUser: User) {
    const user = await systemDb.findUserById(userId, currentUser.sessionId);
    if (!user) throw new Error('User not found');

    const resetRequest: NonNullable<User['reset_request']> = {
      ...(user.reset_request || { status: 'pending', requested_at: new Date().toISOString() }),
      status: 'denied',
      denial_reason: reason
    };

    await authDb.updateUserRaw(userId, { reset_request: resetRequest }, currentUser.sessionId);

    return { success: true };
  }

  async updatePreferences(preferences: Record<string, boolean>, currentUser: User) {
    await authDb.updateUserRaw(currentUser.id, { notification_preferences: preferences }, currentUser.sessionId);
    return { success: true };
  }

  async getSessions(currentUser: User) {
    const userId = currentUser.role === 'admin' ? undefined : currentUser.id;
    return authDb.findAllSessions(currentUser.sessionId!, userId);
  }

  async getRoleCount() {
    const [teachers, admins, total] = await Promise.all([
        systemDb.countUsersByRole(USER_ROLES.TEACHER),
        systemDb.countUsersByRole(USER_ROLES.ADMIN),
        systemDb.countUsersByRole()
    ]);
    return { teachers, admins, total };
  }

  async getRoleUserCount(role: string): Promise<number> {
    return systemDb.countUsersByRole(role);
  }

  async getCurrentUser(id: string, sessionId: string): Promise<User> {
    const user = await systemDb.findUserById(id, sessionId);
    if (!user) throw new Error('User not found');
    return { ...user, sessionId };
  }

  async getAllUsers(currentUser: User): Promise<User[]> {
    if (!rbac.can(currentUser, 'user:manage')) throw new Error('Forbidden');
    return systemDb.findAllUsers(currentUser.sessionId!);
  }

  async updateUserProfile(currentUser: User, userId: string, updates: Partial<User>, sessionId: string): Promise<User> {
    const targetUser = await systemDb.findUserById(userId, sessionId);
    if (!targetUser) throw new Error('User not found');

    UserDomain.validateUpdate(currentUser, userId);

    if (rbac.can(currentUser, 'user:manage')) {
        await systemDb.adminUpdateUser(userId, updates, sessionId);
        return (await systemDb.findUserById(userId, sessionId))!;
    }

    const filteredUpdates = UserDomain.filterUpdateFields(currentUser, updates);
    return systemDb.updateUser(userId, { ...filteredUpdates, version: targetUser.version }, sessionId);
  }

  async toggleUserStatus(currentUser: User, userId: string, active: boolean): Promise<void> {
    if (!rbac.can(currentUser, 'user:manage')) throw new Error('Forbidden');
    const targetUser = await systemDb.findUserById(userId, currentUser.sessionId);
    if (!targetUser) throw new Error('User not found');
    await systemDb.updateUser(userId, { active, version: targetUser.version }, currentUser.sessionId!);
  }

  async deleteUser(currentUser: User, userId: string): Promise<void> {
    if (!rbac.can(currentUser, 'user:manage')) throw new Error('Forbidden');
    await systemDb.deleteUser(userId, currentUser.sessionId!);
  }
}

export const authService = new AuthService();
