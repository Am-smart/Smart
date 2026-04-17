"use server";

import { cookies } from 'next/headers';
import { signData, verifyToken } from './crypto';
import { supabase } from './supabase';
import { User } from './types';
import { validateEmail, normalizeEmail, normalizeInput } from './validation';
import { isRateLimited, recordAttempt, resetRateLimit } from './rate-limit';

const SESSION_COOKIE = 'app-user-session';

/**
 * Normalizes the response from authentication RPCs which may return
 * different formats depending on the database version.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAuthResult(data: any) {
    if (!data) return { user: null, session_id: null };

    if (data.user) {
        return { user: data.user, session_id: data.session_id };
    }

    if (Array.isArray(data) && data.length > 0) {
        return { user: data[0], session_id: null };
    }

    if (data.id && data.email) {
        return { user: data, session_id: null };
    }

    return { user: null, session_id: null };
}

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
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.errors[0]?.message || 'Invalid email' };
  }

  if (!password || password.length === 0) {
    return { success: false, error: 'Password is required' };
  }

  const normalizedEmail = normalizeEmail(email);

  if (isRateLimited(normalizedEmail)) {
    return { success: false, error: `Too many login attempts. Please try again later.` };
  }

  const { data: rawData, error } = await supabase.rpc('authenticate_user', {
    p_email: normalizedEmail,
    p_password: password
  });

  if (error || !rawData) {
    console.error('Login RPC failed:', error || 'No data returned');
    return { success: false, error: 'Authentication service unavailable' };
  }

  // Handle structured response from the enhanced authenticate_user RPC
  if (rawData.success === false) {
    const errorMessage = rawData.error || 'Invalid email or password';
    
    // Track attempts
    if (errorMessage === 'Invalid email or password') {
        recordAttempt(normalizedEmail);
    }
    
    return { success: false, error: errorMessage };
  }

  const { user, session_id } = normalizeAuthResult(rawData);

  if (!user) {
    return { success: false, error: 'Invalid response from authentication server' };
  }

  try {
      const finalSessionId = await ensureSession(user.id, session_id);
      const sessionData = { id: user.id, sessionId: finalSessionId, email: user.email, role: user.role, full_name: user.full_name };
      const token = await signData(sessionData);

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      resetRateLimit(normalizedEmail);
      return { success: true, user: { ...user, sessionId: finalSessionId } };
  } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
  }
}

export async function signup(userData: Partial<User>) {
  if (!userData.email || !userData.password || !userData.full_name) {
      return { success: false, error: 'Email, name, and password are required' };
  }

  const normalizedEmail = normalizeEmail(userData.email);

  const { data: rawData, error } = await supabase.rpc('register_user', {
      p_full_name: normalizeInput(userData.full_name),
      p_email: normalizedEmail,
      p_password: userData.password,
      p_phone: userData.phone ? normalizeInput(userData.phone) : undefined,
      p_role: userData.role || 'student'
  });

  if (error || !rawData) {
    return { success: false, error: 'Signup service unavailable' };
  }

  if (rawData.success === false) {
    return { success: false, error: rawData.error || 'Signup failed' };
  }

  const { user, session_id } = normalizeAuthResult(rawData);

  try {
      const finalSessionId = await ensureSession(user.id, session_id);
      const sessionData = { id: user.id, sessionId: finalSessionId, email: user.email, role: user.role, full_name: user.full_name };
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
    const { supabase, withSession } = await import('./supabase');
    await withSession(supabase.from('sessions'), sessionId).delete().eq('id', sessionId);
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

export async function updatePassword(currentPass: string, newPass: string) {
    const session = await getSession();
    if (!session || !session.sessionId) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase.rpc('update_user_password', {
        p_current_password: currentPass,
        p_new_password: newPass
    }).setHeader('x-session-id', session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}

export async function requestPasswordReset(email: string, reason: string, riskLevel: string) {
    const { data, error } = await supabase.rpc('request_password_reset', {
        p_email: email,
        p_reason: reason,
        p_risk_level: riskLevel
    });

    if (error) throw error;
    return data;
}

export async function updatePreferences(preferences: object) {
    const session = await getSession();
    if (!session || !session.sessionId) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase.rpc('update_user_preferences', {
        p_preferences: preferences
    }).setHeader('x-session-id', session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}

// Admin Password Management Helpers
export async function approveResetRequest(userId: string, tempPassword: string) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase.rpc('approve_password_reset', {
        p_user_id: userId,
        p_temp_password: tempPassword
    }).setHeader('x-session-id', session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}

export async function denyResetRequest(userId: string, reason: string) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase.rpc('deny_password_reset', {
        p_user_id: userId,
        p_reason: reason
    }).setHeader('x-session-id', session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}
