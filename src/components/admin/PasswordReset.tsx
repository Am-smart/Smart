import React, { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { User } from '@/lib/types';
import { hashPassword } from '@/lib/crypto';

interface PasswordResetProps {
    users: User[];
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ users }) => {
    const { client } = useSupabase();
    const [selectedEmail, setSelectedEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmail || !newPassword) return;
        setIsResetting(true);
        try {
            const hashed = await hashPassword(newPassword, selectedEmail);
            const { error } = await client.from('users').update({ password: hashed }).eq('email', selectedEmail);
            if (error) throw error;
            alert(`Password for ${selectedEmail} has been reset successfully.`);
            setNewPassword('');
        } catch (err) {
            console.error('Reset failed:', err);
            alert('Failed to reset password.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Password Management</h2>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <form onSubmit={handleReset} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Select User</label>
                        <select value={selectedEmail} onChange={e => setSelectedEmail(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                            <option value="">Choose a user email...</option>
                            {users.map(u => <option key={u.email} value={u.email}>{u.email} ({u.full_name})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">New Password</label>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={isResetting || !selectedEmail || !newPassword} className="btn-primary w-full py-4 text-center">
                        {isResetting ? 'Processing...' : 'Reset User Password'}
                    </button>
                </form>
            </div>

            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <div className="text-2xl">⚠️</div>
                <div className="text-sm text-amber-800 font-medium">
                    Resetting a password will take effect immediately. Ensure you have verified the user&apos;s identity before proceeding.
                </div>
            </div>
        </div>
    );
};
