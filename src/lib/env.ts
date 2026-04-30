/**
 * Environment variable validation (Next.js safe: server + edge aware)
 * Works with custom session-based auth (no JWT dependency)
 */

const REQUIRED_SERVER_ENV_VARS = [] as const;

const REQUIRED_PUBLIC_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * Validate environment variables safely depending on runtime context
 */
export function validateEnv() {
  const missing: string[] = [];

  // Always safe (public env vars)
  for (const key of REQUIRED_PUBLIC_ENV_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  // Only validate server env if we're NOT in Edge middleware context
  // (Edge can behave differently with process.env resolution)
  const isEdgeRuntime =
    typeof globalThis !== 'undefined' &&
    // @ts-ignore
    globalThis.EdgeRuntime !== undefined;

  if (!isEdgeRuntime) {
    for (const key of REQUIRED_SERVER_ENV_VARS) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;

    console.error('[Env Validation Error]', message);

    if (process.env.NODE_ENV === 'development') {
      throw new Error(message);
    }
  }
}

/**
 * Wrapper for auth/session-protected logic
 */
export function withEnvValidation<T extends (...args: any[]) => any>(fn: T) {
  return (...args: Parameters<T>) => {
    validateEnv();
    return fn(...args);
  };
}
