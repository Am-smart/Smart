import React, { useState } from 'react';
import { Course } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface CourseEditorProps {
    course?: Course;
    teacherEmail: string;
    onSave: () => void;
    onCancel: () => void;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ course, teacherEmail, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        category: course?.category || 'Programming',
        status: course?.status || 'draft',
        thumbnail_url: course?.thumbnail_url || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const courseData = {
                ...formData,
                teacher_email: teacherEmail,
                updated_at: new Date().toISOString()
            };

            const { error } = course?.id
                ? await supabase.from('courses').update(courseData).eq('id', course.id)
                : await supabase.from('courses').insert([courseData]);

            if (error) throw error;
            onSave();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save course.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">{course?.id ? 'Edit Course' : 'Create New Course'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Course Title</label>
                        <input
                            type="text" required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Advanced React Architecture"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="Describe what students will learn..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            >
                                <option>Programming</option>
                                <option>Design</option>
                                <option>Business</option>
                                <option>Marketing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Course['status'] }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Thumbnail URL</label>
                        <input
                            type="url"
                            value={formData.thumbnail_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <footer className="pt-8 border-t flex justify-between gap-4">
                        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-4">Discard Changes</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 py-4">
                            {isSaving ? 'Saving...' : course?.id ? 'Update Course' : 'Create Course'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};
