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
    <div id="login" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Login</h2>
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
        <button type="submit" className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Login Help</p>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>Check caps lock</li>
          <li>Ensure no extra spaces in email</li>
          <li>Try another device if issue persists</li>
        </ul>
      </div>
      <p className="text-center text-sm text-slate-600 mt-6"><a href="#" onClick={onShowReset} className="text-primary hover:underline">Forgot Password?</a></p>
      <p className="text-center text-sm text-slate-600 mt-2">No account? <a href="#" onClick={onShowSignup} className="text-primary font-semibold hover:underline">Create one</a></p>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
