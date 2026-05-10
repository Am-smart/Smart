import 'server-only'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwwszltqalhduvkoycmi.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// If serviceKey is missing, we fall back to null and the adapters will use the standard client.
// This prevents the app from crashing during build/initialization if the env var is not yet set.
export const adminClient = serviceKey
  ? createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;
