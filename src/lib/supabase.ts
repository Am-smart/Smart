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
 * Creates a Supabase client with optional user email header for RLS.
 */
export const createSupabaseClient = (userEmail?: string) => {
  if (!userEmail) return supabase;

  if (clientCache.has(userEmail)) {
      return clientCache.get(userEmail)!;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { 'x-user-email': userEmail },
    },
  });

  clientCache.set(userEmail, client);
  return client;
};

/**
 * Get a Supabase client with the correct user context.
 */
export const getClient = (userEmail?: string) => {
    return createSupabaseClient(userEmail);
};
