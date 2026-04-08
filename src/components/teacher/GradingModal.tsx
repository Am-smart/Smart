import React, { useState } from 'react';
import { Submission } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';

interface GradingModalProps {
    submission: Submission;
    onSave: () => void;
    onCancel: () => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ submission, onSave, onCancel }) => {
    const { client } = useSupabase();
    const [formData, setFormData] = useState({
        grade: submission.grade?.toString() || '',
        feedback: submission.feedback || '',
        points_possible: submission.assignments?.points_possible || 100
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const final_grade = Math.round((Number(formData.grade) / formData.points_possible) * 100);
            const { error } = await client.from('submissions').update({
                grade: Number(formData.grade),
                final_grade,
                feedback: formData.feedback,
                status: 'graded',
                graded_at: new Date().toISOString()
            }).eq('id', submission.id);

            if (error) throw error;
            onSave();
        } catch (err) {
            console.error('Grading failed:', err);
            alert('Failed to save grade.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Grade Submission</h2>
                        <div className="text-xs text-slate-500 font-medium mt-1">Student: {submission.student_email}</div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-700 uppercase mb-2">Student Submission</h4>
                        <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{submission.submission_text || 'No text provided.'}</div>
                        {submission.file_url && (
                            <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-4 text-xs mt-4">View Attached File</a>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Points Earned</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number" required min="0" max={formData.points_possible}
                                    value={formData.grade}
                                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                    placeholder="0"
                                />
                                <span className="text-lg font-bold text-slate-400">/ {formData.points_possible}</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-blue-600 mb-2">Calculated Percentage</div>
                            <div className="text-2xl font-black text-slate-900">
                                {formData.grade ? Math.round((Number(formData.grade) / formData.points_possible) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Feedback</label>
                        <textarea
                            value={formData.feedback}
                            onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                            className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="Great job! Next time try to..."
                        />
                    </div>
                    <footer className="pt-8 border-t flex justify-between gap-4">
                        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-4">Discard</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 py-4">
                            {isSaving ? 'Saving Grade...' : 'Save Grade & Return'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};
