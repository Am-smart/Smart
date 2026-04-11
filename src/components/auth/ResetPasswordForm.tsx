"use client";

import React, { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

interface ResetPasswordFormProps {
  onClose: () => void;
  onShowLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onClose, onShowLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = createSupabaseClient();
      const { data: user, error: fetchError } = await client.from('users').select('email').eq('email', email).maybeSingle();

      if (fetchError) throw fetchError;
      if (!user) {
          setError('No account found with this email.');
          return;
      }

      const { error: updateError } = await client
        .from('users')
        .update({
            reset_request: {
                requested_at: new Date().toISOString(),
                status: 'pending'
            }
        })
        .eq('email', email);

      if (updateError) throw updateError;
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  return (
    <div className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>

      {isSubmitted ? (
        <div className="text-center py-8">
            <div className="text-4xl mb-4 text-green-500">📧</div>
            <p className="text-slate-600 mb-6">Your request has been sent to the administrators. Please check back later or contact support.</p>
            <button onClick={onShowLogin} className="btn-primary w-full py-3">Back to Login</button>
        </div>
      ) : (
        <>
            <p className="text-sm text-slate-500 mb-6">Enter your email address and we&apos;ll send your request to our administrators for a secure reset.</p>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-custom"
                required
                />
                <button type="submit" className="btn-primary w-full py-3">Submit Request</button>
                <p className="text-center text-sm text-slate-600">Remembered your password? <a href="#" onClick={onShowLogin} className="text-primary font-semibold hover:underline">Sign in</a></p>
            </form>
        </>
      )}
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
