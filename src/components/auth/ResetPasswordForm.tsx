"use client";

import React, { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

interface ResetPasswordFormProps {
  onClose: () => void;
  onShowLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onClose, onShowLogin }) => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    "Forgot my password",
    "Account compromised",
    "Login issues",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
        setError('Please select a reason.');
        return;
    }
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason) {
        setError('Please provide a reason.');
        return;
    }

    try {
      const client = createSupabaseClient();
      const { data: success, error: rpcError } = await client.rpc('request_password_reset', {
          p_email: email,
          p_reason: finalReason
      });

      if (rpcError) throw rpcError;
      if (!success) {
          setError('No account found with this email.');
          return;
      }

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
            <p className="text-sm text-slate-500 mb-6">Enter your email and the reason for the reset. Our administrators will review your request.</p>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-custom"
                    required
                />

                <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="input-custom text-sm"
                    required
                >
                    <option value="">Select Reason...</option>
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                {reason === 'Other' && (
                    <input
                        type="text"
                        placeholder="Please specify..."
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        className="input-custom text-sm"
                        required
                    />
                )}

                <button type="submit" className="btn-primary w-full py-3">Submit Request</button>
                <p className="text-center text-sm text-slate-600">Remembered your password? <a href="#" onClick={onShowLogin} className="text-primary font-semibold hover:underline">Sign in</a></p>
            </form>
        </>
      )}
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
};
