"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthContext';

interface LoginFormProps {
  onClose: () => void;
  onShowSignup: () => void;
  onShowReset: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onClose, onShowSignup, onShowReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
          setError(err.message || 'Login failed');
      } else {
          setError('Login failed');
      }
    }
  };

  return (
    <div id="login" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Login</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-custom"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-custom"
          required
        />
        <button type="submit" className="btn-primary w-full py-3">Login</button>
      </form>
      <p className="text-center text-sm text-slate-600 mt-6"><a href="#" onClick={onShowReset} className="text-primary hover:underline">Forgot Password?</a></p>
      <p className="text-center text-sm text-slate-600 mt-2">No account? <a href="#" onClick={onShowSignup} className="text-primary font-semibold hover:underline">Create one</a></p>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
