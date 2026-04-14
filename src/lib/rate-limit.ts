/**
 * Simple rate limiting for auth attempts
 * Stores attempt counts in memory (in production, use Redis)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5; // Max login attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minute window
const CLEANUP_INTERVAL = 60 * 1000; // Cleanup every minute

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Check if a request is rate limited
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    return false;
  }

  // Reset if window has expired
  if (entry.resetTime < now) {
    rateLimitMap.delete(identifier);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

/**
 * Record an attempt
 */
export function recordAttempt(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || entry.resetTime < now) {
    // New entry or window expired
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
  } else {
    // Increment existing entry
    entry.count++;
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Get remaining attempts
 */
export function getRemainingAttempts(identifier: string): number {
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || entry.resetTime < Date.now()) {
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - entry.count);
}
