import redis from "./redis";

/**
 * Rate limiting using Upstash Redis
 */

// Configuration
const MAX_ATTEMPTS = 5; // Max login attempts
const WINDOW_SECONDS = 15 * 60; // 15 minutes

/**
 * Check if request is rate limited
 */
export async function isRateLimited(identifier: string): Promise<boolean> {
  const client = redis();
  if (!client) return false;
  const key = `ratelimit:${identifier}`;

  const count = await client.get<number>(key);

  if (!count) return false;

  return Number(count) >= MAX_ATTEMPTS;
}

/**
 * Record an attempt
 */
export async function recordAttempt(identifier: string): Promise<void> {
  const client = redis();
  if (!client) return;
  const key = `ratelimit:${identifier}`;

  const current = await client.get<number>(key);

  if (!current) {
    // set with expiration (Upstash format)
    await client.set(key, 1, { ex: WINDOW_SECONDS });
  } else {
    await client.incr(key);
  }
}

/**
 * Reset rate limit
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const client = redis();
  if (!client) return;
  const key = `ratelimit:${identifier}`;
  await client.del(key);
}

/**
 * Get remaining attempts
 */
export async function getRemainingAttempts(identifier: string): Promise<number> {
  const client = redis();
  if (!client) return MAX_ATTEMPTS;
  const key = `ratelimit:${identifier}`;

  const count = await client.get<number>(key);

  if (!count) return MAX_ATTEMPTS;

  return Math.max(0, MAX_ATTEMPTS - Number(count));
}
