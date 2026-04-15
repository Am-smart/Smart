import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwwszltqalhduvkoycmi.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3d3N6bHRxYWxoZHV2a295Y21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTMyODAsImV4cCI6MjA5MDM4OTI4MH0.-RVQsKfdYT_ZieGxd8NyVHwL87zwRITJ-qI2vk0LSxY';

/**
 * Singleton instance of the public client.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Cache for user-specific clients to avoid recreating them on every render.
 */
const clientCache = new Map<string, SupabaseClient>();

/**
 * Creates a Supabase client with optional session header for RLS.
 * Always returns the singleton instance when no sessionId is provided.
 * Only creates user-specific clients when a sessionId is provided.
 */
export const createSupabaseClient = (sessionId?: string) => {
  // Always return singleton for public operations
  if (!sessionId) return supabase;

  // For user-specific operations, use cached client or create new one
  if (clientCache.has(sessionId)) {
      return clientCache.get(sessionId)!;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { 'x-session-id': sessionId },
    },
  });

  clientCache.set(sessionId, client);
  return client;
};

/**
 * Get a Supabase client with the correct user context.
 * Prefers the singleton when no sessionId is provided.
 */
export const getClient = (sessionId?: string) => {
    return createSupabaseClient(sessionId);
};
