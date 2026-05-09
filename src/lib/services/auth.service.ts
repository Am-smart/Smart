import { authDb } from '../database/auth.db';
import { systemDb } from '../database/system.db';
import { User } from '../types';
import { UserDomain } from '../domain/user.domain';
import { validatePassword } from '../validation';
import { sessionManager } from '../auth/session-cache';
import { UserMapper } from '../mappers';

export class AuthService {
  async validateSession(sessionId: string): Promise<User | null> {
    // Check cache first
    const cachedUser = sessionManager.get(sessionId);
    if (cachedUser) {
        return { ...cachedUser, sessionId } as User;
    }

    const session = await authDb.findSessionById(sessionId);
    if (!session || new Date(session.expires_at) < new Date()) {
      return null;
    }
    const user = await systemDb.findUserById(session.user_id);
    if (!user) return null;

    const userDTO = UserMapper.toDTO(user);
    if (!userDTO) return null;

    const userWithSession = { ...user, sessionId } as User;
    sessionManager.set(sessionId, userDTO);

    return userWithSession;
  }

  async createSession(userId: string): Promise<string> {
    // Implement strict single active session enforcement:
    // Invalidate all previously issued sessions for this user.
    const { supabase } = await import('../supabase');
    await supabase.from('sessions').delete().eq('user_id', userId);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session = await authDb.createSession(userId, expiresAt);
    return session.id;
  }

  async logout(sessionId: string): Promise<void> {
    await authDb.deleteSession(sessionId);
  }

  async authenticate(email: string, password?: string) {
    const { comparePassword } = await import('../crypto');

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

    // Block users who used their temp pass but haven't changed it
    if (user.reset_request && (user.reset_request as any).status === 'approved_used') {
       return { data: { success: false, error: 'Your session has expired. You must change your password using the secure prompt provided during your first login.' }, error: null };
    }

    // Verify password
    const isPasswordValid = password && user.password && await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // PASSWORD FAILED: Check if there is reset info to show
      if (user.reset_request) {
        const reset = user.reset_request as any;
        if (reset.status === 'pending') {
          return { data: { success: false, error: 'Your password reset request is under review.' }, error: null };
        } else if (reset.status === 'approved') {
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

    // Successful login
    // One-time temp password usage: If login with temp pass succeeds, mark it as used
    if (user.reset_request && (user.reset_request as any).status === 'approved') {
       const reset = user.reset_request as any;
       if (new Date(reset.expires_at) < now) {
          return { data: { success: false, error: 'Temporary password has expired. Please request a new one.' }, error: null };
       }
       const newResetRequest = { ...reset, status: 'approved_used' };
       delete newResetRequest.temp_password;
       await authDb.updateUserRaw(user.id, { reset_request: newResetRequest });
    }

    await authDb.updateUserRaw(user.id, { last_login: now.toISOString(), failed_attempts: 0, locked_until: null });
    const sessionId = await this.createSession(user.id);

    // Call maintenance cleanup on login
    const { systemService } = await import('./system.service');
    systemService.performSystemCleanup(sessionId).catch(console.error);

    return {
      data: {
        success: true,
        user: user,
        session_id: sessionId
      },
      error: null
    };
  }

  async signup(data: { full_name: string; email: string; password?: string; phone?: string; role: string }) {
    const { hashPassword } = await import('../crypto');

    if (data.password) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0].message);
      }
    }

    // Check if email already exists
    const existingUser = await systemDb.findUserByEmail(data.email);
    if (existingUser) {
      if (existingUser.reset_request) {
        const reset = existingUser.reset_request as any;
        if (reset.status === 'pending') {
          return { data: { success: false, error: 'This email is registered. A password reset request is under review.' }, error: null };
        } else if (reset.status === 'approved') {
          return { data: { success: false, error: `This email is registered. Password reset approved. Temp Pass: ${reset.temp_password}` }, error: null };
        } else if (reset.status === 'denied') {
          return { data: { success: false, error: `This email is registered. Previous reset request denied: ${reset.denial_reason}` }, error: null };
        }
      }
      return { data: { success: false, error: 'An account with this email already exists.' }, error: null };
    }

    // Role limits
    if (data.role === 'teacher' || data.role === 'admin') {
      const count = await this.getRoleUserCount(data.role);
      if (count >= 3) {
        return { data: { success: false, error: `Public creation limit reached for ${data.role}s.` }, error: null };
      }
    }

    const hashedPassword = data.password ? await hashPassword(data.password) : '';
    const { data: userData, error } = await authDb.register({
      ...data,
      password: hashedPassword,
      active: true
    });

    if (error) return { data: null, error };

    const newUser = userData as User;
    const sessionId = await this.createSession(newUser.id);

    return {
      data: {
        success: true,
        user: newUser,
        session_id: sessionId
      },
      error: null
    };
  }

  async createUser(currentUser: User, data: { full_name: string; email: string; password?: string; phone?: string; role: string }, _sessionId: string) {
    const { hashPassword } = await import('../crypto');

    if (!UserDomain.isAdmin(currentUser)) {
        throw new Error('Forbidden: Only admins can create users directly');
    }

    if (data.password) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0].message);
      }
    }

    const hashedPassword = data.password ? await hashPassword(data.password) : '';
    return authDb.register({
      ...data,
      password: hashedPassword,
      active: true
    });
  }

  async updatePassword(currentPass: string, newPass: string, sessionId: string) {
    const { comparePassword, hashPassword } = await import('../crypto');
    const session = await this.validateSession(sessionId);
    if (!session) return { success: false, error: 'Unauthorized' };

    const user = await systemDb.findUserById(session.id as string, sessionId);
    if (!user) return { success: false, error: 'User not found' };

    const isPasswordValid = user.password && await comparePassword(currentPass, user.password);
    if (!isPasswordValid) return { success: false, error: 'Incorrect current password' };

    const hashedPassword = await hashPassword(newPass);
    await authDb.updateUserRaw(user.id, { password: hashedPassword, reset_request: null }, sessionId);

    // Invalidate other sessions
    const { supabase } = await import('../supabase');
    await supabase.from('sessions').delete().eq('user_id', user.id).neq('id', sessionId);

    return { success: true };
  }

  async requestPasswordReset(email: string, reason: string, riskLevel: string) {
    const user = await systemDb.findUserByEmail(email);
    if (!user) return { success: false, error: 'No account found with this email.' };

    if (user.reset_request) {
      const reset = user.reset_request as any;
      if (reset.status === 'pending') {
        return { success: false, error: 'A request is already under review for this account.' };
      } else if (reset.status === 'approved' && new Date(reset.expires_at) > new Date()) {
        return { success: false, error: `Reset approved. Temp Password: ${reset.temp_password}` };
      }
    }

    const resetRequest = {
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

  async approvePasswordReset(userId: string, tempPassword: string, sessionId: string) {
    const { hashPassword } = await import('../crypto');
    const hashedPassword = await hashPassword(tempPassword);

    const user = await systemDb.findUserById(userId, sessionId);
    if (!user) throw new Error('User not found');

    const resetRequest = {
      ...(user.reset_request as any || {}),
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
    }, sessionId);

    return { success: true };
  }

  async denyPasswordReset(userId: string, reason: string, sessionId: string) {
    const user = await systemDb.findUserById(userId, sessionId);
    if (!user) throw new Error('User not found');

    const resetRequest = {
      ...(user.reset_request as any || {}),
      status: 'denied',
      denial_reason: reason
    };

    await authDb.updateUserRaw(userId, { reset_request: resetRequest }, sessionId);

    return { success: true };
  }

  async updatePreferences(preferences: object, sessionId: string) {
    const session = await this.validateSession(sessionId);
    if (!session) return { success: false, error: 'Unauthorized' };

    await authDb.updateUserRaw(session.id as string, { notification_preferences: preferences }, sessionId);
    return { success: true };
  }

  async getSessions(currentUser: User, sessionId: string) {
    const userId = currentUser.role === 'admin' ? undefined : currentUser.id;
    return authDb.findAllSessions(sessionId, userId);
  }

  async getRoleCount() {
    const { supabase } = await import('../supabase');
    const { USER_ROLES } = await import('../constants');

    const [teachers, admins, total] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', USER_ROLES.TEACHER),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', USER_ROLES.ADMIN),
        supabase.from('users').select('*', { count: 'exact', head: true })
    ]);
    return {
        teachers: teachers.count || 0,
        admins: admins.count || 0,
        total: total.count || 0
    };
  }

  async getRoleUserCount(role: string): Promise<number> {
    const { supabase } = await import('../supabase');
    const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', role);
    return count || 0;
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

    if (UserDomain.isAdmin(currentUser)) {
        await systemDb.adminUpdateUser(userId, updates, sessionId);
        return (await systemDb.findUserById(userId, sessionId))!;
    }

    const filteredUpdates = UserDomain.filterUpdateFields(currentUser, updates);

    return systemDb.updateUser(userId, { ...filteredUpdates, version: targetUser.version }, sessionId);
  }

  async toggleUserStatus(currentUser: User, userId: string, active: boolean, sessionId: string): Promise<void> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    const targetUser = await systemDb.findUserById(userId, sessionId);
    if (!targetUser) throw new Error('User not found');
    await systemDb.updateUser(userId, { active, version: targetUser.version }, sessionId);
  }

  async deleteUser(currentUser: User, userId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageUsers(currentUser)) throw new Error('Forbidden');
    await systemDb.deleteUser(userId, sessionId);
  }
}

export const authService = new AuthService();
