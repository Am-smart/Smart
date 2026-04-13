"use client";

import React, { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { hashPassword } from '@/lib/crypto';

interface SignupFormProps {
  onClose: () => void;
  onShowLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onClose, onShowLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const hashedPassword = await hashPassword(formData.password, formData.email);
      const client = createSupabaseClient();
      const { error: signupError } = await client
        .from('users')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: hashedPassword,
          role: formData.role
        }]);
      if (signupError) throw signupError;
      onShowLogin();
    } catch (err: unknown) {
      if (err instanceof Error) {
          setError(err.message || 'Signup failed');
      } else {
          setError('Signup failed');
      }
    }
  };

  return (
    <div id="signup" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Sign Up</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          className="input-custom"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="input-custom"
          required
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="input-custom"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="input-custom"
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          className="input-custom"
          required
        />
        <button type="submit" className="btn-primary w-full py-3">Create Account</button>
        <p className="text-center text-sm text-slate-600">Already have an account? <a href="#" onClick={onShowLogin} className="text-primary font-semibold hover:underline">Sign in</a></p>
      </form>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
