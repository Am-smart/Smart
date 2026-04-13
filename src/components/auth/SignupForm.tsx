"use client";

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { useAuth } from './AuthContext';

interface SignupFormProps {
  initialRole?: UserRole;
  onClose: () => void;
  onShowLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ initialRole, onClose, onShowLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole || 'student'
  });
  const [error, setError] = useState('');

  const { signup } = useAuth();

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await signup({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role
      });
      onClose();
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

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Select your role:</p>
          <div className="flex gap-2">
            {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 rounded-xl border-2 transition-all text-sm font-bold capitalize ${
                  formData.role === r
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3">Create Account</button>
        <p className="text-center text-sm text-slate-600">Already have an account? <a href="#" onClick={onShowLogin} className="text-primary font-semibold hover:underline">Sign in</a></p>
      </form>
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
