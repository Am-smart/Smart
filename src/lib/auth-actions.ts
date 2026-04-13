"use server";

import { cookies } from 'next/headers';
import { hashPassword, signData, verifyToken } from './crypto';
import { supabase } from './supabase';
import { User } from './types';

const SESSION_COOKIE = 'app-user-session';

/**
 * Normalizes the response from authentication RPCs which may return
 * different formats depending on the database version.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAuthResult(data: any) {
    if (!data) return { user: null, session_id: null };

    // Case 1: Nested object { user: {...}, session_id: "..." }
    if (data.user) {
        return { user: data.user, session_id: data.session_id };
    }

    // Case 2: Array of user objects [{...}]
    if (Array.isArray(data) && data.length > 0) {
        return { user: data[0], session_id: null };
    }

    // Case 3: Direct user object {...}
    if (data.id && data.email) {
        return { user: data, session_id: null };
    }

    return { user: null, session_id: null };
}

/**
 * Ensures a session exists for the user. If the RPC didn't return one,
 * it attempts to create one manually.
 */
async function ensureSession(userId: string, existingSessionId?: string | null): Promise<string> {
    if (existingSessionId) return existingSessionId;

    const { data, error } = await supabase
        .from('sessions')
        .insert({
            user_id: userId,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Manual session creation failed:', error);
        throw new Error('Authentication established but session creation failed. Please contact an administrator.');
    }

    return data.id;
}

export async function login(email: string, password: string) {
  const hashedPassword = await hashPassword(password, email);

  const { data: rawData, error } = await supabase.rpc('authenticate_user', {
    p_email: email,
    p_password: hashedPassword
  });

  if (error || !rawData) {
    return { success: false, error: 'Invalid email or password' };
  }

  const { user, session_id } = normalizeAuthResult(rawData);

  if (!user) {
    return { success: false, error: 'Invalid response from authentication server' };
  }

  if (!user.active) {
    return { success: false, error: 'Account is deactivated' };
  }

  try {
      const finalSessionId = await ensureSession(user.id, session_id);

      const sessionData = {
        id: user.id,
        sessionId: finalSessionId,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };

      const token = await signData(sessionData);

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      return { success: true, user: { ...user, sessionId: finalSessionId } };
  } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
  }
}

export async function signup(userData: Partial<User>) {
  if (!userData.password || !userData.email) {
      return { success: false, error: 'Email and password are required' };
  }
  const hashedPassword = await hashPassword(userData.password, userData.email);

  const { data: rawData, error } = await supabase.rpc('register_user', {
      p_full_name: userData.full_name,
      p_email: userData.email,
      p_password: hashedPassword,
      p_phone: userData.phone || null,
      p_role: userData.role || 'student'
  });

  if (error || !rawData) {
    return { success: false, error: error?.message || 'Signup failed' };
  }

  const { user, session_id } = normalizeAuthResult(rawData);

  if (!user) {
    return { success: false, error: 'Signup succeeded but user data is missing' };
  }

  try {
      const finalSessionId = await ensureSession(user.id, session_id);

      const sessionData = {
        id: user.id,
        sessionId: finalSessionId,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };

      const token = await signData(sessionData);

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      return { success: true, user: { ...user, sessionId: finalSessionId } };
  } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
  }
}

export async function logout() {
  const session = await getSession();
  if (session && typeof session === 'object' && 'sessionId' in session) {
    const sessionId = session.sessionId as string;
    const { createSupabaseClient } = await import('./supabase');
    const client = createSupabaseClient(sessionId);
    await client.from('sessions').delete().eq('id', sessionId);
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;

  return verifyToken(session.value);
}
