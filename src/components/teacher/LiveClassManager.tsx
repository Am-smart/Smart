import React, { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { LiveClass, Course } from '@/lib/types';
import { Video, Calendar, Clock, Trash2, Users, Play } from 'lucide-react';

interface LiveClassManagerProps {
    teacherEmail: string;
    liveClasses: LiveClass[];
    courses: Course[];
    onRefresh: () => void;
}

export const LiveClassManager: React.FC<LiveClassManagerProps> = ({ teacherEmail, liveClasses, courses, onRefresh }) => {
    const { client } = useSupabase();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        course_id: courses[0]?.id || '',
        start_at: '',
        end_at: '',
        room_name: ''
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await client.from('live_classes').insert([{
                ...formData,
                teacher_email: teacherEmail,
                status: 'scheduled',
                room_name: formData.room_name || `room_${Math.random().toString(36).substr(2, 9)}`,
                meeting_url: `https://meet.jit.si/${formData.room_name || Math.random().toString(36).substr(2, 9)}`
            }]);
            if (error) throw error;
            setIsFormOpen(false);
            onRefresh();
        } catch (err) {
            console.error('Failed to schedule class:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Cancel this class?')) return;
        await client.from('live_classes').delete().eq('id', id);
        onRefresh();
    };

    const toggleStatus = async (lc: LiveClass) => {
        const newStatus = lc.status === 'live' ? 'ended' : 'live';
        await client.from('live_classes').update({ status: newStatus }).eq('id', lc.id);
        onRefresh();
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Live Sessions</h2>
                <button onClick={() => setIsFormOpen(true)} className="btn-primary flex items-center gap-2">
                    <Video size={18} />
                    Schedule Class
                </button>
            </header>

            {isFormOpen && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-6">New Live Session</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Class Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-custom" placeholder="Weekly Sync-up" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Course</label>
                            <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="input-custom">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Room Name</label>
                            <input type="text" value={formData.room_name} onChange={e => setFormData({...formData, room_name: e.target.value})} className="input-custom" placeholder="unique-room-id" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Start Time</label>
                            <input type="datetime-local" required value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="input-custom" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">End Time</label>
                            <input type="datetime-local" required value={formData.end_at} onChange={e => setFormData({...formData, end_at: e.target.value})} className="input-custom" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary">Save Session</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveClasses.map(lc => (
                    <div key={lc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900">{lc.title}</h3>
                                <p className="text-xs text-slate-500 font-medium">{courses.find(c => c.id === lc.course_id)?.title}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${lc.status === 'live' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                {lc.status}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Calendar size={14} />
                                {new Date(lc.start_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Clock size={14} />
                                {new Date(lc.start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(lc.end_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 flex gap-3">
                            <button onClick={() => toggleStatus(lc)} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${lc.status === 'live' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`}>
                                {lc.status === 'live' ? 'Stop Session' : <><Play size={14} /> Start Session</>}
                            </button>
                            <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
                                <Users size={18} />
                            </button>
                            <button onClick={() => handleDelete(lc.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
