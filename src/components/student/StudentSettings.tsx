import React, { useState } from 'react';
import { User } from '@/lib/types';
import { Bell, User as UserIcon, Lock, Save } from 'lucide-react';

interface StudentSettingsProps {
    user: User;
    onUpdate: (updates: Partial<User>) => Promise<void>;
}

export const StudentSettings: React.FC<StudentSettingsProps> = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        phone: user.phone || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onUpdate(formData);
            alert('Settings updated successfully!');
        } catch (err) {
            console.error('Update failed:', err);
            alert('Failed to update settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm text-blue-600 font-bold border border-blue-100">
                        <UserIcon size={18} /> Profile Info
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-2xl transition-all">
                        <Bell size={18} /> Notifications
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-2xl transition-all">
                        <Lock size={18} /> Security
                    </button>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">🎓</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{user.email}</h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Student Account • Level {user.level || 1}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <button type="submit" disabled={isSaving} className="btn-primary w-full md:w-auto px-8 flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    {isSaving ? 'Saving Changes...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
