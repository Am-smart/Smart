import React, { useState } from 'react';
import { Assignment, Course } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';

interface AssignmentEditorProps {
    assignment?: Assignment;
    courses: Course[];
    onSave: () => void;
    onCancel: () => void;
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ assignment, courses, onSave, onCancel }) => {
    const { client } = useSupabase();
    const [formData, setFormData] = useState({
        title: assignment?.title || '',
        description: assignment?.description || '',
        course_id: assignment?.course_id || (courses.length > 0 ? courses[0].id : ''),
        due_date: assignment?.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        points_possible: assignment?.points_possible || 100,
        status: assignment?.status || 'draft',
        anti_cheat_enabled: assignment?.anti_cheat_enabled || false
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = assignment?.id
                ? await client.from('assignments').update(formData).eq('id', assignment.id)
                : await client.from('assignments').insert([formData]);
            if (error) throw error;
            onSave();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save assignment.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">{assignment?.id ? 'Edit Assignment' : 'Create New Assignment'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Assignment Title</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Description</label>
                        <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Course</label>
                            <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Due Date</label>
                            <input type="date" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Points Possible</label>
                            <input type="number" required value={formData.points_possible} onChange={e => setFormData({...formData, points_possible: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Assignment['status']})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <input type="checkbox" id="antiCheat" checked={formData.anti_cheat_enabled} onChange={e => setFormData({...formData, anti_cheat_enabled: e.target.checked})} className="w-5 h-5 text-blue-600" />
                        <label htmlFor="antiCheat" className="text-sm font-bold text-amber-900 cursor-pointer">Enable Anti-Cheat Protection</label>
                    </div>
                    <footer className="pt-8 border-t flex justify-between gap-4">
                        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-4">Discard</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 py-4">{isSaving ? 'Saving...' : 'Save Assignment'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};
