"use client";

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { useAuth } from './AuthContext';
import { validateSignupForm, normalizeEmail, normalizeInput } from '@/lib/validation';
import { getRoleCount } from '@/lib/data-actions';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [roleCounts, setRoleCounts] = useState({ teachers: 0, admins: 0, total: 0 });

  const { signup } = useAuth();

  // Fetch role counts on mount
  useEffect(() => {
    const fetchRoleCounts = async () => {
      try {
        const counts = await getRoleCount();
        setRoleCounts(counts);
      } catch (err) {
        console.error('Failed to fetch role counts:', err);
      }
    };

    fetchRoleCounts();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validate input
    const validation = validateSignupForm(
      formData.fullName,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.phone
    );

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
      const normalizedEmail = normalizeEmail(formData.email);
      const normalizedName = normalizeInput(formData.fullName);
      
      await signup({
          full_name: normalizedName,
          email: normalizedEmail,
          phone: formData.phone ? normalizeInput(formData.phone) : undefined,
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="signup" className="bg-white w-full max-w-md rounded-xl sm:rounded-2xl p-4 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-xl sm:text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 pr-6">Sign Up</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-3 sm:space-y-4">
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className={`input-custom ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-red-500 text-xs mt-1">{errors.fullName}</p>
          )}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
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
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className={`input-custom ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
            disabled={isLoading}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
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
        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className={`input-custom ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-semibold text-slate-700">Select your role:</p>
          <div className="flex gap-1 sm:gap-2">
            {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => {
              const isLimitReached = roleCounts.total >= 3 && (r === 'teacher' || r === 'admin');
              const isDisabled = isLoading || isLimitReached;

              return (
                <div key={r} className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    disabled={isDisabled}
                    title={isLimitReached ? 'Teacher and admin creation limit reached (3)' : ''}
                    className={`w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 transition-all text-xs sm:text-sm font-bold capitalize disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.role === r
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                  {isLimitReached && (
                    <span className="absolute -top-5 left-0 right-0 text-center text-red-500 text-xs whitespace-nowrap">Limit reached</span>
                  )}
                </div>
              );
            })}
          </div>
          {roleCounts.total >= 3 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              Note: Public creation of teachers and admins is limited to 3. Please contact support to create more.
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
        <p className="text-center text-xs sm:text-sm text-slate-600">Already have an account? <button onClick={(e) => { e.preventDefault(); onShowLogin(); }} className="text-primary font-semibold hover:underline">Sign in</button></p>
      </form>
      {error && <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
