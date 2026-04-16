import React, { useState } from 'react';
import { Course } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';

interface CourseEditorProps {
    teacherId: string;
    course?: Course;

    onSave: () => void;
    onCancel: () => void;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ course, teacherId, onSave, onCancel }) => {
    const { client } = useSupabase();
    const { addToast } = useAppContext();
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        category: course?.category || 'Programming',
        status: course?.status || 'draft',
        thumbnail_url: course?.thumbnail_url || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60'
    });
    const [isSaving, setIsSaving] = useState(false);
    const { addToQueue, isOnline } = useIndexedDB();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const courseData = {
                ...formData,
                teacher_id: teacherId,
                updated_at: new Date().toISOString()
            };

            if (isOnline) {
                const { error } = course?.id
                    ? await client.from('courses').update(courseData).eq('id', course.id)
                    : await client.from('courses').insert([courseData]);

                if (error) throw error;
                addToast('Course saved successfully!', 'success');
            } else {
                await addToQueue('COURSE_SAVE', course?.id ? { id: course.id, ...courseData } : courseData);
                addToast('Offline: Course changes queued for synchronization.', 'info');
            }

            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save course.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
                <header className="p-6 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{course?.id ? 'Edit Course' : 'Create New Course'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                    {!isOnline && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold uppercase">
                            ⚠️ Working Offline - Changes will sync later
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Course Title</label>
                        <input
                            type="text" required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                            placeholder="e.g. Advanced React Architecture"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                            placeholder="Describe what students will learn..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                            >
                                <option>Programming</option>
                                <option>Design</option>
                                <option>Business</option>
                                <option>Marketing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Course['status'] }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Thumbnail URL</label>
                        <input
                            type="url"
                            value={formData.thumbnail_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                    </div>
                </form>
                <footer className="p-6 md:p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between gap-4 shrink-0">
                    <button type="button" onClick={onCancel} className="btn-secondary py-4 text-sm flex-1">Discard Changes</button>
                    <button type="submit" disabled={isSaving} onClick={handleSubmit} className="btn-primary py-4 text-sm flex-1">
                        {isSaving ? 'Saving...' : course?.id ? 'Update Course' : 'Create Course'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
