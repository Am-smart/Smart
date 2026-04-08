import React, { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Course } from '@/lib/types';

interface BroadcastManagerProps {
    initialCourses: Course[];
}

export const BroadcastManager: React.FC<BroadcastManagerProps> = ({ initialCourses }) => {
    const { client } = useSupabase();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('all');
    const [targetRole, setTargetRole] = useState<'all' | 'student' | 'teacher'>('all');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return;

        setIsSending(true);
        try {
            const { error } = await client.from('broadcasts').insert([{
                course_id: selectedCourseId === 'all' ? null : selectedCourseId,
                target_role: targetRole === 'all' ? null : targetRole,
                title,
                message,
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            setTitle('');
            setMessage('');
            alert('Broadcast sent successfully!');
        } catch (err: unknown) {
            console.error('Broadcast failed:', err);
            alert('Failed to send broadcast.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold mb-6">Send Global Broadcast</h3>
            <form onSubmit={handleSend} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Target Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50"
                        >
                            <option value="all">All Courses (System-wide)</option>
                            {initialCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Target Role</label>
                        <select
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value as 'all' | 'student' | 'teacher')}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50"
                        >
                            <option value="all">Everyone</option>
                            <option value="student">Students Only</option>
                            <option value="teacher">Teachers Only</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Broadcast Title</label>
                    <input
                        type="text" required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                        placeholder="Maintenance Alert, New Feature, etc."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Message Content</label>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all min-h-[120px]"
                        placeholder="Describe the announcement in detail..."
                    ></textarea>
                </div>

                <button type="submit" disabled={isSending} className="btn-primary w-full py-4 text-lg">
                    {isSending ? 'Sending...' : '📢 Dispatch Broadcast'}
                </button>
            </form>
        </div>
    );
};
