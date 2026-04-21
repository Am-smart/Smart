import React, { useState, useEffect, useCallback } from 'react';
import { Badge, User } from '@/lib/types';
import { Plus, Trash2, Award } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { saveBadge, deleteBadge, assignBadge, getBadges, getUsers } from '@/lib/data-actions';

export const BadgeManager: React.FC = () => {
    const { addToast } = useAppContext();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', icon_url: '🏆' });

    const fetchData = useCallback(async () => {
        const [badgeData, userData] = await Promise.all([
            getBadges(),
            getUsers()
        ]);
        setBadges(badgeData || []);
        setStudents(userData.filter(u => u.role === 'student') || []);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveBadge(formData);
            setIsFormOpen(false);
            fetchData();
        } catch (err) {
            console.error('Failed to create badge:', err);
            addToast('Failed to create badge.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this badge?')) {
            try {
                await deleteBadge(id);
                fetchData();
            } catch (err) {
                console.error('Failed to delete badge:', err);
                addToast('Failed to delete badge.', 'error');
            }
        }
    };

    const handleAward = async (badgeId: string, studentId: string) => {
        if (!studentId) return;
        try {
            await assignBadge({
                badge_id: badgeId,
                user_id: studentId
            });
            addToast('Badge awarded successfully!', 'success');
        } catch (err) {
            console.error('Failed to award badge:', err);
            addToast('Awarding failed. Student might already have this badge.', 'error');
        }
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
                                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
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
