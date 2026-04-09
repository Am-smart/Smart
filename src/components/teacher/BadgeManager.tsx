import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Badge, User } from '@/lib/types';
import { Plus, Trash2, Award } from 'lucide-react';

export const BadgeManager: React.FC = () => {
    const { client } = useSupabase();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', icon_url: '🏆' });

    const fetchData = useCallback(async () => {
        const [badgeRes, studentRes] = await Promise.all([
            client.from('badges').select('*'),
            client.from('users').select('*').eq('role', 'student')
        ]);
        setBadges(badgeRes.data || []);
        setStudents(studentRes.data || []);
    }, [client]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await client.from('badges').insert([formData]);
        setIsFormOpen(false);
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this badge?')) {
            await client.from('badges').delete().eq('id', id);
            fetchData();
        }
    };

    const handleAward = async (badgeId: string, studentEmail: string) => {
        if (!studentEmail) return;
        const { error } = await client.from('user_badges').insert([{
            badge_id: badgeId,
            user_email: studentEmail,
            awarded_at: new Date().toISOString()
        }]);
        if (error) alert('Awarding failed. Student might already have this badge.');
        else alert('Badge awarded successfully!');
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Achievement Badges</h2>
                <button onClick={() => setIsFormOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Create Badge
                </button>
            </header>

            {isFormOpen && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-custom" placeholder="Quick Learner" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Icon (Emoji or URL)</label>
                                <input type="text" required value={formData.icon_url} onChange={e => setFormData({...formData, icon_url: e.target.value})} className="input-custom" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Description</label>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-custom h-24 resize-none" placeholder="Awarded for completing..." />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">Save Badge</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map(badge => (
                    <div key={badge.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4">
                        <div className="text-4xl">{badge.icon_url}</div>
                        <div>
                            <h3 className="font-bold text-slate-900">{badge.title}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">{badge.description}</p>
                        </div>

                        <div className="mt-auto w-full pt-4 space-y-4">
                            <div className="flex gap-2">
                                <select id={`student-${badge.id}`} className="input-custom py-2 text-xs">
                                    <option value="">Award to student...</option>
                                    {students.map(s => <option key={s.email} value={s.email}>{s.full_name}</option>)}
                                </select>
                                <button
                                    onClick={() => {
                                        const select = document.getElementById(`student-${badge.id}`) as HTMLSelectElement;
                                        handleAward(badge.id, select.value);
                                    }}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                                >
                                    <Award size={18} />
                                </button>
                            </div>
                            <button onClick={() => handleDelete(badge.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mx-auto">
                                <Trash2 size={12} />
                                Delete Badge
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
