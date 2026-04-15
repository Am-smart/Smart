"use server";

import { cookies } from 'next/headers';
import { signData, verifyToken } from './crypto';
import { supabase } from './supabase';
import { User } from './types';
import { validateEmail, validatePassword, validateFullName, validatePhone, normalizeEmail, normalizeInput } from './validation';
import { isRateLimited, recordAttempt, resetRateLimit, getRemainingAttempts } from './rate-limit';

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
  // Validate and normalize inputs
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.errors[0]?.message || 'Invalid email' };
  }

  if (!password || password.length === 0) {
    return { success: false, error: 'Password is required' };
  }

  if (password.length > 128) {
    return { success: false, error: 'Invalid password' };
  }

  const normalizedEmail = normalizeEmail(email);

  // Check rate limiting
  if (isRateLimited(normalizedEmail)) {
    const remainingTime = Math.ceil(15); // 15 minutes
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${remainingTime} minutes.`
    };
  }

  // NOTE: We pass the RAW password to the RPC.
  // The RPC will verify it using crypt() on the server side.
  const { data: rawData, error } = await supabase.rpc('authenticate_user', {
    p_email: normalizedEmail,
    p_password: password
  });

  if (error || !rawData) {
    console.error('Login RPC failed:', error || 'No data returned');
    // Record failed attempt
    recordAttempt(normalizedEmail);
    const remaining = getRemainingAttempts(normalizedEmail);
    
    if (remaining === 0) {
      return { success: false, error: 'Too many login attempts. Please try again later.' };
    } else if (remaining <= 2) {
      return { success: false, error: `Invalid email or password. ${remaining} attempts remaining.` };
    }
    
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

      // Clear rate limit on successful login
      resetRateLimit(normalizedEmail);

      return { success: true, user: { ...user, sessionId: finalSessionId } };
  } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message };
  }
}

export async function signup(userData: Partial<User>) {
  // Validate required fields
  if (!userData.email || !userData.password || !userData.full_name) {
      return { success: false, error: 'Email, name, and password are required' };
  }

  // Validate email
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.errors[0]?.message || 'Invalid email' };
  }

  const normalizedEmail = normalizeEmail(userData.email);

  // Check rate limiting for signup attempts
  if (isRateLimited(normalizedEmail)) {
    return {
      success: false,
      error: 'Too many signup attempts. Please try again later.'
    };
  }

  // Validate full name
  const nameValidation = validateFullName(userData.full_name);
  if (!nameValidation.isValid) {
    return { success: false, error: nameValidation.errors[0]?.message || 'Invalid name' };
  }

  // Validate password
  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    return { success: false, error: passwordValidation.errors[0]?.message || 'Password does not meet requirements' };
  }

  // Validate phone if provided
  if (userData.phone) {
    const phoneValidation = validatePhone(userData.phone);
    if (!phoneValidation.isValid) {
      return { success: false, error: phoneValidation.errors[0]?.message || 'Invalid phone number' };
    }
  }

  // Normalize inputs
  const normalizedName = normalizeInput(userData.full_name);
  const normalizedPhone = userData.phone ? normalizeInput(userData.phone) : undefined;

  // NOTE: We pass the RAW password to the RPC.
  // The RPC will hash it using crypt() on the server side.
  const { data: rawData, error } = await supabase.rpc('register_user', {
      p_full_name: normalizedName,
      p_email: normalizedEmail,
      p_password: userData.password,
      p_phone: normalizedPhone,
      p_role: userData.role || 'student'
  });

  if (error || !rawData) {
    console.error('Signup RPC failed:', error || 'No data returned');
    // Record failed signup attempt
    recordAttempt(normalizedEmail);
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

      // Clear rate limit on successful signup
      resetRateLimit(normalizedEmail);

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
