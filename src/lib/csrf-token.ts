/**
 * CSRF Token generation and validation
 * Tokens are stored in-memory with an expiration time
 */

import crypto from 'crypto';

interface CSRFTokenEntry {
  hash: string;
  expiresAt: number;
}

const tokenStore = new Map<string, CSRFTokenEntry>();
const TOKEN_EXPIRY_MS = 1 * 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL = 10 * 60 * 1000; // Cleanup every 10 minutes

// Periodic cleanup of expired tokens
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tokenStore.entries()) {
    if (entry.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Generate a new CSRF token
 * Returns a random token string to send to client
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  
  tokenStore.set(hash, {
    hash,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS
  });

  return token;
}

/**
 * Validate a CSRF token
 * Client sends the token, we hash it and check if it exists
 */
export function validateCSRFToken(token: string): boolean {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const entry = tokenStore.get(hash);

  if (!entry) {
    return false;
  }

  // Check if token has expired
  if (entry.expiresAt < Date.now()) {
    tokenStore.delete(hash);
    return false;
  }

  // Token is valid, delete it (single-use)
  tokenStore.delete(hash);
  return true;
}

/**
 * Invalidate a token immediately (logout, etc)
 */
export function invalidateCSRFToken(token: string): void {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  tokenStore.delete(hash);
}
