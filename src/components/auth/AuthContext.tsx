"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { User } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { login as loginAction, logout as logoutAction, getSession } from '@/lib/auth-actions';

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
        // 1. Try secure session first
        const session = await getSession();
        if (session) {
            const { data: user } = await createSupabaseClient().from('users').select('*').eq('email', session.email).single();
            if (user) {
                await setCache('current_user', user);
                setState({ user: user as User, role: user.role, isLoading: false });
                return;
            }
        }

        // 2. Fallback to cache for offline support
        const cachedUser = await getCache<User>('current_user');
        if (cachedUser) {
            setState({ user: cachedUser, role: cachedUser.role, isLoading: false });
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    initAuth();
  }, [getCache, setCache]);

  const login = useCallback(async (email: string, pass: string) => {
    const result = await loginAction(email, pass);
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.user as User;
    await setCache('current_user', u);
    setState({
        user: u,
        role: u.role,
        isLoading: false
    });
  }, [setCache]);

  const logout = useCallback(async () => {
    await logoutAction();
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
