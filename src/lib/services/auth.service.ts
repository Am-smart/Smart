import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { AuthRepository } from '../repositories/auth.repository';

export class AuthService {
  private userRepo = new UserRepository();
  private sessionRepo = new SessionRepository();
  private authRepo = new AuthRepository();

  async validateSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || new Date(session.expires_at) < new Date()) {
      return null;
    }
    const user = await this.userRepo.findById(session.user_id);
    if (!user) return null;
    return { id: user.id, sessionId: session.id, email: user.email, role: user.role, full_name: user.full_name };
  }

  async createSession(userId: string): Promise<string> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session = await this.sessionRepo.create(userId, expiresAt);
    return session.id;
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepo.delete(sessionId);
  }

  async authenticate(email: string, password: string) {
    return this.authRepo.authenticate(email, password);
  }

  async register(data: { full_name: string; email: string; password: string; phone?: string; role: string }) {
    return this.authRepo.register(data);
  }

  async updatePassword(currentPass: string, newPass: string, sessionId: string) {
    return this.authRepo.updatePassword(currentPass, newPass, sessionId);
  }

  async requestPasswordReset(email: string, reason: string, riskLevel: string) {
    return this.authRepo.requestPasswordReset(email, reason, riskLevel);
  }

  async approvePasswordReset(userId: string, tempPassword: string, sessionId: string) {
    return this.authRepo.approvePasswordReset(userId, tempPassword, sessionId);
  }

  async denyPasswordReset(userId: string, reason: string, sessionId: string) {
    return this.authRepo.denyPasswordReset(userId, reason, sessionId);
  }

  async updatePreferences(preferences: object, sessionId: string) {
    return this.authRepo.updatePreferences(preferences, sessionId);
  }
}

export const authService = new AuthService();
