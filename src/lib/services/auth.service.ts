import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';

export class AuthService {
  private userRepo = new UserRepository();
  private sessionRepo = new SessionRepository();

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
}

export const authService = new AuthService();
