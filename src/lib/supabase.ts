import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwwszltqalhduvkoycmi.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3d3N6bHRxYWxoZHV2a295Y21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTMyODAsImV4cCI6MjA5MDM4OTI4MH0.-RVQsKfdYT_ZieGxd8NyVHwL87zwRITJ-qI2vk0LSxY';

/**
 * Singleton instance of the public client.
 * Configured to disable all default Supabase Auth behaviors.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to inject the session ID into a Supabase query or RPC call.
 * This avoids creating multiple client instances.
 * Handles both plain objects and Headers instances for maximum compatibility.
 */
export function withSession<T>(query: T, sessionId?: string): T {
  if (sessionId && query && typeof query === 'object' && 'headers' in query) {
    const q = query as Record<string, unknown>;
    if (q.headers && typeof q.headers === 'object' && q.headers !== null) {
      const headers = q.headers as Record<string, unknown> & { set?: (key: string, value: string) => void };
      if (typeof headers.set === 'function') {
        headers.set('x-session-id', sessionId);
      } else {
        (q.headers as Record<string, string>)['x-session-id'] = sessionId;
      }
    }
  }
  return query;
}
