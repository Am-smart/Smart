"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { User } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { hashPassword } from '@/lib/crypto';

interface AuthState {
  user: User | null;
  role: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, role: null, isLoading: true });
  const { setCache, getCache, addToQueue, isOnline } = useIndexedDB();

  useEffect(() => {
    const initAuth = async () => {
        let user: User | null = null;
        let role: string | null = null;

        // 1. Try local storage (fastest for persistence)
        const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
        if (saved) {
            try {
                user = JSON.parse(saved) as User;
                role = user.role;
            } catch (e) {
                console.error('Failed to parse user from local storage:', e);
            }
        }

        // 2. Try IndexedDB Cache if local storage failed or to sync data
        if (!user) {
            const cachedUser = await getCache<User>('current_user');
            if (cachedUser) {
                user = cachedUser;
                role = cachedUser.role;
            }
        }

        // 3. Fallback to session storage (Legacy compatibility)
        if (!user && typeof window !== 'undefined') {
            const raw = sessionStorage.getItem('currentUser');
            if (raw) {
                try {
                    user = JSON.parse(raw) as User;
                    role = user.role;
                } catch (e) {
                    console.error('Failed to parse user from session storage:', e);
                }
            }
        }

        // Sync state and cache
        if (user) {
            await setCache('current_user', user);
            if (typeof window !== 'undefined') {
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
        }

        setState({ user, role, isLoading: false });
    };

    initAuth();
  }, [getCache, setCache]);

  const login = useCallback(async (email: string, pass: string) => {
    const hashedPass = await hashPassword(pass, email);
    const client = createSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', hashedPass)
      .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error('Invalid email or password');
        }
        throw error;
    }
    if (data) {
      const u = data as User;
      if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentUser', JSON.stringify(u));
          localStorage.setItem('currentUser', JSON.stringify(u));
      }
      await setCache('current_user', u);
      setState({
          user: u,
          role: u.role,
          isLoading: false
      });
    }
  }, [setCache]);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
    }
    await setCache('current_user', null);
    setState({
        user: null,
        role: null,
        isLoading: false
    });
  }, [setCache]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return;
    const updatedUser = { ...state.user, ...updates };

    // Optimistic Update
    await setCache('current_user', updatedUser);
    if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    setState(prev => ({ ...prev, user: updatedUser }));

    if (isOnline) {
        const client = createSupabaseClient(state.user.email);
        const { error } = await client.from('users').update(updates).eq('email', state.user.email);
        if (error) throw error;
    } else {
        await addToQueue('PROFILE_UPDATE', { email: state.user.email, ...updates }, state.user.email);
    }
  }, [state.user, isOnline, setCache, addToQueue]);

  const contextValue = useMemo(() => ({
    ...state,
    login,
    logout,
    updateProfile
  }), [state, login, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
