"use server";

import { cookies } from 'next/headers';
import { signData, verifyToken } from './crypto';
import { User } from './types';
import { validateEmail, normalizeEmail, normalizeInput } from './validation';
import { isRateLimited, recordAttempt, resetRateLimit } from './rate-limit';
import { authService } from './services/auth.service';
import { supabase } from './supabase';

const SESSION_COOKIE = 'app-user-session';

function normalizeAuthResult(data: Record<string, unknown> | null) {
    if (!data) return { user: null, session_id: null, error: 'No response from server' };
    if (data.success === true) return { user: data.user, session_id: data.session_id, error: null };
    if (data.success === false) return { user: null, session_id: null, error: data.error || 'Authentication failed' };
    if (data.user) return { user: data.user, session_id: data.session_id, error: null };
    if (data.id && data.email) return { user: data, session_id: null, error: null };
    return { user: null, session_id: null, error: 'Invalid response format' };
}

export async function login(email: string, password: string) {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return { success: false, error: emailValidation.errors[0]?.message || 'Invalid email' };
  if (!password || password.length === 0) return { success: false, error: 'Password is required' };

  const normalizedEmail = normalizeEmail(email);
  if (isRateLimited(normalizedEmail)) return { success: false, error: `Too many login attempts. Please try again later.` };

  const { data: rawData, error: rpcError } = await supabase.rpc('authenticate_user', {
    p_email: normalizedEmail,
    p_password: password
  });

  if (rpcError) return { success: false, error: 'Authentication service unavailable' };
  const { user, session_id, error: authError } = normalizeAuthResult(rawData as Record<string, unknown>);
  if (authError) {
    if (authError === 'Invalid email or password') recordAttempt(normalizedEmail);
    return { success: false, error: authError as string };
  }
  if (!user) return { success: false, error: 'Invalid response from authentication server' };

  try {
      const finalSessionId = (session_id as string) || await authService.createSession((user as User).id);
      const sessionData = { id: (user as User).id, sessionId: finalSessionId, email: (user as User).email, role: (user as User).role, full_name: (user as User).full_name };
      const token = await signData(sessionData);

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      resetRateLimit(normalizedEmail);
      return { success: true, user: { ...(user as User), sessionId: finalSessionId }, error: null as unknown as string };
  } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
  }
}

export async function signup(userData: Partial<User>) {
  if (!userData.email || !userData.password || !userData.full_name) return { success: false, error: 'Email, name, and password are required' };

  const normalizedEmail = normalizeEmail(userData.email);
  const { data: rawData, error: rpcError } = await supabase.rpc('register_user', {
      p_full_name: normalizeInput(userData.full_name),
      p_email: normalizedEmail,
      p_password: userData.password,
      p_phone: userData.phone ? normalizeInput(userData.phone) : undefined,
      p_role: userData.role || 'student'
  });

  if (rpcError) return { success: false, error: 'Signup service unavailable' };
  const { user, session_id, error: authError } = normalizeAuthResult(rawData as Record<string, unknown>);
  if (authError) return { success: false, error: authError as string };

  try {
      const finalSessionId = (session_id as string) || await authService.createSession((user as User).id);
      const sessionData = { id: (user as User).id, sessionId: finalSessionId, email: (user as User).email, role: (user as User).role, full_name: (user as User).full_name };
      const token = await signData(sessionData);
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      return { success: true, user: { ...(user as User), sessionId: finalSessionId }, error: null as unknown as string };
  } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error };
  }
}

export async function logout() {
  const session = await getSession();
  if (session && session.sessionId) await authService.logout(session.sessionId as string);
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
