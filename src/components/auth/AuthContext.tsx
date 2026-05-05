"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import * as actions from '@/lib/api-actions';
import { sessionManager } from '@/lib/session-manager';

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

  const logout = useCallback(async () => {
    sessionManager.cleanupSession();
    const res = await actions.logout();
    if (!res.success) {
        console.error('Logout failed:', res.error);
    }
    await setCache('current_user', null);
    setState({
        user: null,
        role: null,
        isLoading: false
    });
  }, [setCache]);

  useEffect(() => {
    const controller = new AbortController();
    const initAuth = async () => {
        // 1. Try secure session first
        try {
          const session = await actions.getSession();
          if (session) {
              // Session validation check
              const sessionInfo = await actions.getSessions();
              const currentSession = sessionInfo.find(s => s.id === session.sessionId);

              if (!currentSession || new Date(currentSession.expires_at) < new Date()) {
                  console.warn('Session expired or invalid');
                  await logout();
                  return;
              }

              // Token Rotation / Session Refresh logic
              const expiresAt = new Date(currentSession.expires_at);
              const now = new Date();
              const diffMs = expiresAt.getTime() - now.getTime();
              const refreshThreshold = 24 * 60 * 60 * 1000; // 1 day

              const userDTO = await actions.getMe(controller.signal);

              if (diffMs < refreshThreshold && isOnline && userDTO) {
                  console.log('Refreshing session (Token Rotation)...');
                  // We can re-save the user profile which in our simplified system could trigger session update
                  // or we just call a dedicated refresh if we had one.
                  // For now, we update preferences as a way to keep session alive in DB
                  await actions.updatePreferences(userDTO.notification_preferences || {});
              }
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

    return () => controller.abort();
  }, [getCache, setCache, pullData, logout]);

  const login = useCallback(async (email: string, pass: string) => {
    const result = await actions.login({ email, password: pass });
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = { ...result.data!.user, sessionId: result.data!.sessionId } as User;
    await setCache('current_user', u);
    setState(prev => ({
        ...prev,
        user: u,
        role: u.role,
        isLoading: false
    }));
  }, [setCache]);

  const signup = useCallback(async (userData: Partial<User>) => {
    const result = await actions.signup(userData);
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = { ...result.data!.user, sessionId: result.data!.sessionId } as User;
    await setCache('current_user', u);
    setState(prev => ({
        ...prev,
        user: u,
        role: u.role,
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
