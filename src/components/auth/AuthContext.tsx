"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  role: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, role: null, isLoading: true });

  useEffect(() => {
    let user: User | null = null;
    let role: string | null = null;

    if (typeof window !== 'undefined') {
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

    // Using a microtask to avoid synchronous setState warning in effect
    // This complies with the lint rule while ensuring the state is initialized as soon as possible.
    queueMicrotask(() => {
        setState({ user, role, isLoading: false });
    });
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', pass)
      .single();

    if (error) throw error;
    if (data) {
      const u = data as User;
      sessionStorage.setItem('currentUser', JSON.stringify(u));
      setState({
          user: u,
          role: u.role,
          isLoading: false
      });
    }
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('currentUser');
    setState({
        user: null,
        role: null,
        isLoading: false
    });
  }, []);

  const contextValue = useMemo(() => ({
    ...state,
    login,
    logout
  }), [state, login, logout]);

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
