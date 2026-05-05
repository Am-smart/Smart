import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwwszltqalhduvkoycmi.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3d3N6bHRxYWxoZHV2a295Y21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTMyODAsImV4cCI6MjA5MDM4OTI4MH0.-RVQsKfdYT_ZieGxd8NyVHwL87zwRITJ-qI2vk0LSxY';

const isServer = typeof window === 'undefined';

// Unified client with environment detection
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: !isServer,
  },
});

// Backward compatibility export
export const supabaseServer = supabase;

/**
 * Helper to inject the session ID into a Supabase query or RPC call.
 * This avoids creating multiple client instances.
 * Handles both plain objects and Headers instances for maximum compatibility.
 */
export function withSession<T>(query: T, sessionId?: string): T {
  if (!sessionId) return query;

  // For Supabase v2 PostgREST queries, use .headers() if available
  const qHeaders = query as unknown as { headers: (headers: Record<string, string>) => T };
  if (qHeaders && typeof qHeaders.headers === 'function') {
    return qHeaders.headers({ 'x-session-id': sessionId });
  }

  // Handle other types of query objects with setHeader or internal headers object
  const q = query as unknown as { setHeader: (key: string, value: string) => void };
  if (q && typeof q.setHeader === 'function') {
    q.setHeader('x-session-id', sessionId);
    return query;
  }

  if (query && typeof query === 'object' && 'headers' in query) {
    const qObj = query as Record<string, unknown>;
    if (qObj.headers && typeof qObj.headers === 'object' && qObj.headers !== null) {
      const headers = qObj.headers as Record<string, unknown> & { set?: (key: string, value: string) => void };
      if (typeof headers.set === 'function') {
        headers.set('x-session-id', sessionId);
      } else {
        (qObj.headers as Record<string, string>)['x-session-id'] = sessionId;
      }
    }
  }
  return query;
}
