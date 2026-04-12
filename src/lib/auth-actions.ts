"use server";

import { cookies } from 'next/headers';
import { hashPassword, signData, verifyToken } from './crypto';
import { supabase } from './supabase';
import { User } from './types';

const SESSION_COOKIE = 'app-user-session';

export async function login(email: string, password: string) {
  const hashedPassword = await hashPassword(password, email);

  const { data, error } = await supabase.rpc('authenticate_user', {
    p_email: email,
    p_password: hashedPassword
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return { success: false, error: 'Invalid email or password' };
  }

  const user = Array.isArray(data) ? data[0] : data;

  if (!user.active) {
    return { success: false, error: 'Account is deactivated' };
  }

  // Create a verifiable session in the database
  const { data: sessionRecord, error: sessionError } = await supabase
    .from('sessions')
    .insert([{
      user_id: user.id,
      expires_at: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000).toISOString()
    }])
    .select()
    .single();

  if (sessionError || !sessionRecord) {
    return { success: false, error: 'Failed to create session' };
  }

  const sessionData = {
    id: user.id,
    sessionId: sessionRecord.id,
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

  return { success: true, user: { ...user, sessionId: sessionRecord.id } };
}

export async function signup(userData: Partial<User>) {
  if (!userData.password || !userData.email) {
      return { success: false, error: 'Email and password are required' };
  }
  const hashedPassword = await hashPassword(userData.password, userData.email);

  const { data, error } = await supabase.rpc('register_user', {
      p_full_name: userData.full_name,
      p_email: userData.email,
      p_password: hashedPassword,
      p_phone: userData.phone || null,
      p_role: userData.role || 'student'
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Create a verifiable session in the database
  const { data: sessionRecord, error: sessionError } = await supabase
    .from('sessions')
    .insert([{
      user_id: data.id,
      expires_at: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000).toISOString()
    }])
    .select()
    .single();

  if (sessionError || !sessionRecord) {
    return { success: false, error: 'Failed to create session' };
  }

  const sessionData = {
    id: data.id,
    sessionId: sessionRecord.id,
    email: data.email,
    role: data.role,
    full_name: data.full_name
  };

  const token = await signData(sessionData);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  return { success: true, user: { ...data, sessionId: sessionRecord.id } };
}

export async function logout() {
  const session = await getSession();
  if (session?.sessionId) {
    await supabase.from('sessions').delete().eq('id', session.sessionId);
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
