/**
 * Helper to inject the session ID into a Supabase query or RPC call.
 * This avoids creating multiple client instances.
 * Handles both plain objects and Headers instances for maximum compatibility.
 */
export function withSession<T>(query: T, sessionId?: string): T {
  if (!sessionId) return query;

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
