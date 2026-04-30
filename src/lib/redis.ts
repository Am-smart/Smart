import { Redis } from "@upstash/redis";

/**
 * Upstash Redis (serverless-safe, Vercel-ready)
 * - No TCP connections
 * - No build-time crashes
 * - Lazy initialization
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
    console.warn("Redis not configured. Skipping initialization.");
    return null;
  }

  redis = new Redis({ url, token });

  return redis;
}

export default getRedis;
