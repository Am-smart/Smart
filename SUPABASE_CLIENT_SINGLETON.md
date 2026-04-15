# Supabase Client Singleton Implementation

## Overview
This document explains how the SmartLMS application implements a single Supabase client instance to prevent the "Multiple GoTrueClient instances detected" warning.

## Problem Statement
When multiple Supabase client instances are created in the same browser context, it causes:
- Authentication state inconsistencies
- Unreliable session management
- Real-time subscription issues
- Undefined behavior when clients try to use the same storage key

The error message from console:
```
Multiple GoTrueClient instances detected in the same browser context. 
It is not an error, but this should be avoided as it may produce undefined 
behavior when used concurrently under the same storage key.
```

## Solution Architecture

### 1. Singleton Public Client
**File**: `src/lib/supabase.ts`

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- Created once and exported for use throughout the application
- Used for public operations that don't require user-specific RLS headers
- Used in server-side functions (auth-actions.ts, data-actions.ts)
- Used in client components for anonymous operations

### 2. Cached User-Specific Clients
For operations that need user-specific row-level security (RLS):

```typescript
const clientCache = new Map<string, SupabaseClient>();

export const createSupabaseClient = (sessionId?: string) => {
  if (!sessionId) return supabase; // Return singleton
  
  if (clientCache.has(sessionId)) {
    return clientCache.get(sessionId)!;
  }
  
  // Create client with session header for RLS
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { 'x-session-id': sessionId },
    },
  });
  
  clientCache.set(sessionId, client);
  return client;
};
```

- Maintains a cache of user-specific clients indexed by sessionId
- Only creates new client if one doesn't exist for that sessionId
- Reuses existing clients for the same user

### 3. Usage Patterns

#### Server-Side Code (Server Actions)
**File**: `src/lib/auth-actions.ts`
```typescript
import { supabase } from './supabase';

// Always use the singleton for server operations
const { data, error } = await supabase.rpc('authenticate_user', {...});
```

**File**: `src/lib/data-actions.ts`
```typescript
import { supabase } from './supabase';

// Server actions use the singleton
export async function enrollInCourse(courseId: string) {
  const { error } = await supabase.from('enrollments').upsert({...});
}
```

#### Client-Side Code (Hooks)
**File**: `src/hooks/useSupabase.ts`
```typescript
import { getClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';

export const useSupabase = () => {
  const { user } = useAuth();
  
  // Get cached client with user's sessionId for RLS
  const client = useMemo(() => getClient(user?.sessionId), [user?.sessionId]);
  
  // Use client for all database operations
  return { client, ... };
};
```

#### Client Components
**File**: `src/components/auth/ResetPasswordForm.tsx`
```typescript
import { supabase } from '@/lib/supabase';

// Use singleton for public operations (password reset)
const { data: success } = await supabase.rpc('request_password_reset', {...});
```

## Key Rules

1. **Always use singleton (`supabase`) for**:
   - Server-side operations (auth-actions, data-actions)
   - Anonymous/public operations
   - Any operation that doesn't need user-specific RLS

2. **Use getClient(sessionId) for**:
   - User-specific operations that need RLS
   - Only when you have an active user with a sessionId
   - Hooks like useSupabase that need per-user context

3. **NEVER call createSupabaseClient() without sessionId**:
   - This will still return the singleton (see updated implementation)
   - But it's better to explicitly use `supabase` directly for clarity

## Changes Made

### Fixed Files
1. **src/lib/supabase.ts** - Updated createSupabaseClient to clearly document singleton behavior
2. **src/lib/data-actions.ts** - Removed import of createSupabaseClient, uses supabase directly
3. **src/components/auth/ResetPasswordForm.tsx** - Changed from createSupabaseClient() to supabase import

## Testing
To verify the fix works:
1. Open browser DevTools Console
2. Check that no "Multiple GoTrueClient instances" warning appears
3. Test login/signup flow to ensure authentication works
4. Verify real-time features (notifications, discussions) work correctly

## Benefits
- Single source of truth for authentication state
- Consistent session management across the app
- Reliable real-time subscriptions
- No undefined behavior from concurrent client usage
- Improved performance (fewer client instantiations)
