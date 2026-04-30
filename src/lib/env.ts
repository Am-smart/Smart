/**
 * Environment variable validation at startup
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'JWT_SECRET',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('Environment Validation Failed:', error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(error);
    }
  }
}

// Call validation immediately when this file is imported
if (typeof window === 'undefined') {
  validateEnv();
}
