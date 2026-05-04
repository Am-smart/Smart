import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CourseDTO } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';
import { saveCourse } from '@/lib/api-actions';

interface CourseEditorProps {
    teacherId: string;
    course?: CourseDTO;

    onSave: () => void;
    onCancel: () => void;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ course, teacherId, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        course_id: course?.course_id || '',
        status: course?.status || 'draft',
        thumbnail_url: course?.thumbnail_url || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
        metadata: course?.metadata ? JSON.parse(JSON.stringify(course.metadata)) : {}
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
                id: course?.id
            };

            if (isOnline) {
                await saveCourse(courseData);
                addToast('Course saved successfully!', 'success');
            } else {
                await addToQueue('COURSE_SAVE', courseData);
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
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" aria-busy={isSaving}>
            <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <header className="p-5 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-lg md:text-2xl font-bold text-slate-900">{course?.id ? 'Edit Course' : 'Create New Course'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors" aria-label="Close dialog">
                        <X size={24} className="text-slate-600" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1">
                    {!isOnline && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold uppercase">
                            ⚠️ Working Offline - Changes will sync later
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Course Title *</label>
                        <input
                            type="text" required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                            placeholder="e.g. Advanced React Architecture"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Description *</label>
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
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Enrollment Course ID (Optional)</label>
                            <input
                                type="text"
                                value={formData.course_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="e.g. CS101"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">If provided, students will need this ID to enroll.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
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
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Metadata (JSON format)</label>
                        <textarea
                            value={JSON.stringify(formData.metadata, null, 2)}
                            onChange={(e) => {
                                try {
                                    const metadata = JSON.parse(e.target.value);
                                    setFormData(prev => ({ ...prev, metadata }));
                                } catch {
                                    // Allow invalid JSON while typing
                                }
                            }}
                            className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                            placeholder='{ "key": "value" }'
                        />
                    </div>
                </form>
                <footer className="p-5 md:p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between gap-3 md:gap-4 shrink-0">
                    <button type="button" onClick={onCancel} className="btn-secondary py-3 md:py-4 text-sm flex-1">Discard Changes</button>
                    <button type="submit" disabled={isSaving} className="btn-primary py-3 md:py-4 text-sm flex-1">
                        {isSaving ? 'Saving...' : course?.id ? 'Update Course' : 'Create Course'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
