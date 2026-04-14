"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { validateLoginForm, normalizeEmail } from '@/lib/validation';

interface LoginFormProps {
  onClose: () => void;
  onShowSignup: () => void;
  onShowReset: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onClose, onShowSignup, onShowReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validate input
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      await login(normalizedEmail, password);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
          setError(err.message || 'Login failed');
      } else {
          setError('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login" className="bg-white w-full max-w-md rounded-xl sm:rounded-2xl p-4 sm:p-8 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-xl sm:text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 pr-6">Login</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`input-custom ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`input-custom ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
        <button type="submit" className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <p className="text-center text-xs sm:text-sm text-slate-600">Don&apos;t have an account? <button onClick={(e) => { e.preventDefault(); onShowSignup(); }} className="text-primary font-semibold hover:underline">Sign up</button></p>
        <p className="text-center text-xs sm:text-sm text-slate-600"><button onClick={(e) => { e.preventDefault(); onShowReset(); }} className="text-primary font-semibold hover:underline">Forgot your password?</button></p>
      </form>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
