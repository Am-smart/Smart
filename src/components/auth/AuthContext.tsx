"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import * as actions from '@/lib/api-actions';
import { sessionManager } from '@/lib/session-manager';
import { useRouter } from 'next/navigation';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  role: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });
  const { setCache, getCache, addToQueue, isOnline, pullData } = useIndexedDB();
  const router = useRouter();

  const logout = useCallback(async () => {
    // 1. Ensure backend session is invalidated first
    try {
        const res = await actions.logout();
        if (!res.success) {
            console.error('Logout backend failure:', res.error);
        }
    } catch (err) {
        console.error('Logout network/server error:', err);
    }

    // 2. Clear local storage and IndexedDB
    sessionManager.cleanupSession();

    // 3. Clear local state and cache regardless of backend success to avoid trapping user
    await setCache('current_user', null);
    setState({
        user: null,
        isLoading: false
    });

    // 4. SPA routing to landing
    router.push('/');
  }, [setCache, router]);

  useEffect(() => {
    const controller = new AbortController();
    const initAuth = async () => {
        // 1. Try secure session first
        try {
      const userDTO = await actions.getMe(controller.signal);
      if (userDTO) {
          const user = userDTO as User;
          await setCache('current_user', user);
          setState({ user, isLoading: false });
          // Background pull
          pullData(user.id, user.role);
          return;
          }
        } catch (err) {
            console.error('Auth initialization error:', err);
        }

        // 2. Fallback to cache for offline support
        const cachedUser = await getCache<User>('current_user');
        if (cachedUser) {
            setState({ user: cachedUser, isLoading: false });
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    initAuth();

    return () => controller.abort();
  }, [getCache, setCache, pullData, logout, isOnline]);

  const login = useCallback(async (email: string, pass: string) => {
    const result = await actions.login({ email, password: pass });
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.data!.user as User;
    await setCache('current_user', u);
    setState(prev => ({
        ...prev,
        user: u,
        isLoading: false
    }));
  }, [setCache]);

  const signup = useCallback(async (userData: Partial<User>) => {
    const result = await actions.signup(userData);
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.data!.user as User;
    await setCache('current_user', u);
    setState(prev => ({
        ...prev,
        user: u,
        isLoading: false
    }));
  }, [setCache]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return;
    const updatedUser = { ...state.user, ...updates };

    // Optimistic Update
    await setCache('current_user', updatedUser);
    setState(prev => ({ ...prev, user: updatedUser }));

    if (isOnline) {
        const res = await actions.updateProfile(updates);
        if (!res.success) {
            throw new Error(res.error);
        }
    } else {
        await addToQueue('PROFILE_UPDATE', { id: state.user.id, ...updates });
    }
  }, [state.user, isOnline, setCache, addToQueue]);

  const contextValue = useMemo(() => ({
    ...state,
    role: state.user?.role || null,
    login,
    signup,
    logout,
    updateProfile
  }), [state, login, signup, logout, updateProfile]);

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
