import { Redis } from "@upstash/redis";

/**
 * Upstash Redis (Vercel-safe, lazy initialization)
 * - No build-time crashes
 * - No Edge runtime issues
 * - Only initializes when actually used
 */

let redis: Redis | null = null;

export function getRedis() {
  if (typeof window !== "undefined") {
    throw new Error("Redis can only be used on the server");
  }

  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[Redis] Missing env vars. Redis disabled.");
    return null;
  }

  redis = new Redis({ url, token });

  return redis;
}

/**
 * Optional default export for convenience
 * (still lazy internally)
 */
export default getRedis;
