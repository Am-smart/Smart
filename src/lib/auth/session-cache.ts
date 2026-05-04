import { UserDTO } from '../types';

interface CachedSession {
  user: UserDTO;
  expiresAt: number;
}

const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const sessionCache = new Map<string, CachedSession>();

export const sessionManager = {
  get(sessionId: string): UserDTO | null {
    const cached = sessionCache.get(sessionId);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      sessionCache.delete(sessionId);
      return null;
    }

    return cached.user;
  },

  set(sessionId: string, user: UserDTO): void {
    sessionCache.set(sessionId, {
      user,
      expiresAt: Date.now() + SESSION_CACHE_TTL
    });
  },

  invalidate(sessionId: string): void {
    sessionCache.delete(sessionId);
  },

  clear(): void {
    sessionCache.clear();
  }
};
