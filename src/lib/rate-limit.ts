import redis from './redis';

/**
 * Rate limiting using Redis
 */

// Configuration
const MAX_ATTEMPTS = 5; // Max login attempts
const WINDOW_MS = 15 * 60; // 15 minute window in seconds

/**
 * Check if a request is rate limited
 */
export async function isRateLimited(identifier: string): Promise<boolean> {
  const key = `ratelimit:${identifier}`;
  const count = await redis.get(key);

  if (!count) {
    return false;
  }

  return parseInt(count) >= MAX_ATTEMPTS;
}

/**
 * Record an attempt
 */
export async function recordAttempt(identifier: string): Promise<void> {
  const key = `ratelimit:${identifier}`;

  const current = await redis.get(key);
  if (!current) {
    await redis.set(key, 1, 'EX', WINDOW_MS);
  } else {
    await redis.incr(key);
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const key = `ratelimit:${identifier}`;
  await redis.del(key);
}

/**
 * Get remaining attempts
 */
export async function getRemainingAttempts(identifier: string): Promise<number> {
  const key = `ratelimit:${identifier}`;
  const count = await redis.get(key);
  
  if (!count) {
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - parseInt(count));
}
