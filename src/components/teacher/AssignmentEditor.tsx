import React, { useState, useEffect } from 'react';
import { Assignment, Course, AssignmentQuestion } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { Plus, Paperclip } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useSupabase } from '@/hooks/useSupabase';

interface AssignmentEditorProps {
    teacherId: string;
    assignment?: Assignment;
    courses: Course[];
    onSave: () => void;
    onCancel: () => void;
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ teacherId, assignment, courses, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const { client } = useSupabase();
    const [formData, setFormData] = useState({
        title: assignment?.title || '',
        description: assignment?.description || '',
        course_id: assignment?.course_id || (courses.length > 0 ? courses[0].id : ''),
        start_at: assignment?.start_at ? new Date(assignment.start_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        due_date: assignment?.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        points_possible: assignment?.points_possible || 0,
        status: assignment?.status || 'draft',
        allow_late_submissions: assignment?.allow_late_submissions !== false,
        late_penalty_per_day: assignment?.late_penalty_per_day || 0,
        anti_cheat_enabled: assignment?.anti_cheat_enabled || false,
        auto_submit_enabled: assignment?.auto_submit_enabled || false,
        hard_enforcement: assignment?.hard_enforcement || false,
        regrade_requests_enabled: assignment?.regrade_requests_enabled !== false,
        questions: assignment?.questions || [],
        attachments: assignment?.attachments || [],
        allowed_extensions: assignment?.allowed_extensions || ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png']
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Auto-calculate points_possible
    useEffect(() => {
        const total = formData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
        setFormData(prev => ({ ...prev, points_possible: total }));
    }, [formData.questions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...formData, teacher_id: teacherId, id: assignment?.id };
            await saveAssignment(payload);
            addToast('Assignment saved successfully!', 'success');
            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save assignment.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addStep = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { text: '', type: 'essay', points: 10 }]
        });
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { filePath } = await uploadFile(file.name, 'materials');
            const { error: uploadError } = await client.storage
                .from('lms-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrl } = client.storage
                .from('lms-files')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), { name: file.name, url: publicUrl.publicUrl, type: file.type }]
            }));
            addToast('Attachment uploaded!', 'success');
        } catch (err) {
            console.error('Attachment upload failed:', err);
            addToast('Upload failed', 'error');
        } finally {
            setIsUploading(false);
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Course</label>
                            <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Start At</label>
                                <input type="datetime-local" required value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Due Date</label>
                                <input type="datetime-local" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Late Submission Settings</h4>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="allowLate" checked={formData.allow_late_submissions} onChange={e => setFormData({...formData, allow_late_submissions: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                            <label htmlFor="allowLate" className="text-sm font-bold text-slate-700 cursor-pointer">Allow Late Submissions</label>
                        </div>

                        {formData.allow_late_submissions && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Penalty Per Day (%)</label>
                                <input
                                    type="number" min="0" max="100"
                                    value={formData.late_penalty_per_day}
                                    onChange={e => setFormData({...formData, late_penalty_per_day: Number(e.target.value)})}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all text-sm"
                                    placeholder="e.g. 5"
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Points Possible (Auto-calculated)</label>
                            <input type="number" readOnly value={formData.points_possible} className="w-full p-4 rounded-xl border-2 border-slate-50 bg-slate-50 text-slate-500 outline-none transition-all font-bold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Assignment['status']})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Attachments (Reference Materials)</label>
                        <div className="flex flex-wrap gap-2">
                            {formData.attachments?.map((att: Record<string, unknown>, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium">
                                    <span className="truncate max-w-[150px]">{att.name as string}</span>
                                    <button type="button" onClick={() => {
                                        const updated = [...(formData.attachments || [])];
                                        updated.splice(idx, 1);
                                        setFormData({ ...formData, attachments: updated });
                                    }} className="text-red-500 font-bold hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center">×</button>
                                </div>
                            ))}
                            <label className={`flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input type="file" className="hidden" onChange={handleAttachmentUpload} disabled={isUploading} />
                                <Paperclip size={12} /> {isUploading ? 'Uploading...' : 'Add Attachment'}
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Allowed File Extensions (Comma separated)</label>
                        <input
                            type="text"
                            value={formData.allowed_extensions.join(', ')}
                            onChange={e => setFormData({ ...formData, allowed_extensions: e.target.value.split(',').map(s => s.trim()) })}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            placeholder="pdf, doc, docx, zip"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <input type="checkbox" id="antiCheat" checked={formData.anti_cheat_enabled} onChange={e => setFormData({...formData, anti_cheat_enabled: e.target.checked})} className="w-5 h-5 text-blue-600" />
                            <label htmlFor="antiCheat" className="text-sm font-bold text-amber-900 cursor-pointer">Anti-Cheat</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <input type="checkbox" id="regradeEnabled" checked={formData.regrade_requests_enabled} onChange={e => setFormData({...formData, regrade_requests_enabled: e.target.checked})} className="w-5 h-5 text-blue-600" />
                            <label htmlFor="regradeEnabled" className="text-sm font-bold text-blue-900 cursor-pointer">Regrade Requests</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <input type="checkbox" id="autoSubmit" checked={formData.auto_submit_enabled} onChange={e => setFormData({...formData, auto_submit_enabled: e.target.checked})} className="w-5 h-5 text-blue-600" />
                            <label htmlFor="autoSubmit" className="text-sm font-bold text-slate-700 cursor-pointer">Auto-Submit</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                            <input type="checkbox" id="hardEnforce" checked={formData.hard_enforcement} onChange={e => setFormData({...formData, hard_enforcement: e.target.checked})} className="w-5 h-5 text-red-600" />
                            <label htmlFor="hardEnforce" className="text-sm font-bold text-red-900 cursor-pointer">Hard Enforce</label>
                        </div>
                    </div>


                    <div className="space-y-6 pt-8 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Task Questions / Steps</h3>
                        </div>
                        {formData.questions.map((q, index) => (
                            <div key={index} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={q.type}
                                        onChange={e => {
                                            const updated = [...formData.questions];
                                            updated[index].type = e.target.value as AssignmentQuestion["type"];
                                            setFormData({ ...formData, questions: updated });
                                        }}
                                        className="p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                    >
                                        <option value="essay">Written Response</option>
                                        <option value="file">File Upload</option>
                                        <option value="link">Link Submission</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={q.points}
                                        onChange={e => {
                                            const updated = [...formData.questions];
                                            updated[index].points = Number(e.target.value);
                                            setFormData({ ...formData, questions: updated });
                                        }}
                                        className="p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                        placeholder="Points"
                                    />
                                </div>
                                <textarea
                                    value={q.text}
                                    onChange={e => {
                                        const updated = [...formData.questions];
                                        updated[index].text = e.target.value;
                                        setFormData({ ...formData, questions: updated });
                                    }}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm min-h-[100px]"
                                    placeholder="Question text or instruction step..."
                                />
                                <button type="button" onClick={() => {
                                    const updated = [...formData.questions];
                                    updated.splice(index, 1);
                                    setFormData({ ...formData, questions: updated });
                                }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Remove Step</button>
                            </div>
                        ))}

                        <button type="button" onClick={addStep} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-bold flex items-center justify-center gap-2">
                            <Plus size={18} /> Add Step
                        </button>
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
