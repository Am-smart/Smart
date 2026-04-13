"use server";

import { cookies } from 'next/headers';
import { hashPassword } from './crypto';
import { supabase } from './supabase';
import { User } from './types';

const SESSION_COOKIE = 'app-user-session';

export async function login(email: string, password: string) {
  const hashedPassword = await hashPassword(password, email);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', hashedPassword)
    .single();

  if (error || !user) {
    return { success: false, error: 'Invalid email or password' };
  }

  if (!user.active) {
    return { success: false, error: 'Account is deactivated' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  return { success: true, user };
}

export async function signup(userData: Partial<User>) {
  if (!userData.password || !userData.email) {
      return { success: false, error: 'Email and password are required' };
  }
  const hashedPassword = await hashPassword(userData.password, userData.email);

  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      active: true
    }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify({
    id: data.id,
    email: data.email,
    role: data.role,
    full_name: data.full_name
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  return { success: true, user: data };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (fetchError || !user) {
    // We return success anyway to prevent email enumeration,
    // but in this internal app we might want to be more explicit.
    return { success: true };
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      reset_request: {
        requested_at: new Date().toISOString(),
        status: 'pending'
      }
    })
    .eq('id', user.id);

  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;

  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}
