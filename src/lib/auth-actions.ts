"use server";

import { cookies } from 'next/headers';
import { signData, verifyToken } from './crypto';
import { User } from './types';
import { validateEmail, validatePassword, validateSignupForm, normalizeEmail, normalizeInput } from './validation';
import { isRateLimited, recordAttempt, resetRateLimit } from './rate-limit';
import { authService } from './services/auth.service';

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

  const { data: rawData, error: rpcError } = await authService.authenticate(normalizedEmail, password);

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

  const validation = validateSignupForm(
    userData.full_name,
    userData.email,
    userData.password,
    userData.password, // Assume confirmation matches for server action
    userData.phone
  );

  if (!validation.isValid) {
    return { success: false, error: validation.errors[0]?.message || 'Invalid input' };
  }

  const normalizedEmail = normalizeEmail(userData.email);
  const { data: rawData, error: rpcError } = await authService.register({
      full_name: normalizeInput(userData.full_name),
      email: normalizedEmail,
      password: userData.password,
      phone: userData.phone ? normalizeInput(userData.phone) : undefined,
      role: userData.role || 'student'
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

    const passwordValidation = validatePassword(newPass);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.errors[0]?.message };
    }

    const { data, error } = await authService.updatePassword(currentPass, newPass, session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}

export async function requestPasswordReset(email: string, reason: string, riskLevel: string) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) throw new Error(emailValidation.errors[0]?.message);

    const { data, error } = await authService.requestPasswordReset(
        normalizeEmail(email),
        normalizeInput(reason),
        riskLevel
    );
    if (error) throw error;
    return data;
}

export async function updatePreferences(preferences: object) {
    const session = await getSession();
    if (!session || !session.sessionId) return { success: false, error: 'Unauthorized' };

    const { data, error } = await authService.updatePreferences(preferences, session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}

export async function approveResetRequest(userId: string, tempPassword: string) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { data, error } = await authService.approvePasswordReset(userId, tempPassword, session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}

export async function denyResetRequest(userId: string, reason: string) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { data, error } = await authService.denyPasswordReset(userId, normalizeInput(reason), session.sessionId as string);

    if (error) return { success: false, error: error.message };
    return data;
}
