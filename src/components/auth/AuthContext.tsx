"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { apiClient } from '@/lib/api-client';
import { sessionManager } from '@/lib/session-manager';
import { UserDTO } from '@/lib/dto/auth.dto';

interface AuthState {
  user: User | null;
  role: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  signup: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, role: null, isLoading: true });
  const { setCache, getCache, addToQueue, isOnline, pullData } = useIndexedDB();

  useEffect(() => {
    const initAuth = async () => {
        // 1. Try secure session first
        try {
          const session = await apiClient.get<{ sessionId: string } | null>('/api/auth/session');
          if (session) {
              const userDTO = await apiClient.get<UserDTO>('/api/auth/me');
              if (userDTO) {
                  const user = { ...userDTO, sessionId: session.sessionId } as User;
                  await setCache('current_user', user);
                  setState({ user, role: user.role, isLoading: false });
                  // Initialize session timeout tracking
                  sessionManager.initSession();
                  // Background pull
                  pullData(user.id, user.sessionId!, user.role);
                  return;
              }
          }
        } catch (err) {
            console.error('Auth initialization error:', err);
        }

        // 2. Fallback to cache for offline support
        const cachedUser = await getCache<User>('current_user');
        if (cachedUser) {
            setState({ user: cachedUser, role: cachedUser.role, isLoading: false });
            sessionManager.initSession();
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    initAuth();
  }, [getCache, setCache, pullData]);

  const login = useCallback(async (email: string, pass: string) => {
    const result = await apiClient.post<{ success: boolean, user: UserDTO, sessionId: string, error?: string }>('/api/auth/login', { email, password: pass });
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = { ...result.user, sessionId: result.sessionId } as User;
    await setCache('current_user', u);
    setState(prev => ({
        ...prev,
        user: u,
        role: u.role,
        isLoading: false
    }));
  }, [setCache]);

  const signup = useCallback(async (userData: Partial<User>) => {
    const result = await apiClient.post<{ success: boolean, user: UserDTO, sessionId: string, error?: string }>('/api/auth/signup', userData);
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = { ...result.user, sessionId: result.sessionId } as User;
    await setCache('current_user', u);
    setState(prev => ({
        ...prev,
        user: u,
        role: u.role,
        isLoading: false
    }));
  }, [setCache]);

  const logout = useCallback(async () => {
    sessionManager.cleanupSession();
    await apiClient.post('/api/auth/logout');
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
        await apiClient.post('/api/auth/profile', updates);
    } else {
        await addToQueue('PROFILE_UPDATE', { id: state.user.id, ...updates }, state.user.sessionId);
    }
  }, [state.user, isOnline, setCache, addToQueue]);

  const contextValue = useMemo(() => ({
    ...state,
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
