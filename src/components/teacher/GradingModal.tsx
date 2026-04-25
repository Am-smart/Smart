import React, { useState } from 'react';
import { Submission } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';

interface GradingModalProps {
    submission: Submission;
    onSave: () => void;
    onCancel: () => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ submission, onSave, onCancel }) => {
    const { addToast } = useAppContext();

    const dueDate = submission.assignments?.due_date ? new Date(submission.assignments.due_date) : null;
    const submittedAt = new Date(submission.submitted_at);
    const isLate = dueDate && submittedAt > dueDate;
    const daysLate = isLate ? Math.ceil((submittedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const penaltyPerDay = submission.assignments?.late_penalty_per_day || 0;
    const calculatedPenalty = isLate ? daysLate * penaltyPerDay : 0;

    const [formData, setFormData] = useState({
        grade: submission.grade?.toString() || '',
        feedback: submission.feedback || '',
        points_possible: submission.assignments?.points_possible || 100,
        regrade_feedback: '',
        response_feedback: (submission.response_feedback as Record<string, string>) || {},
        question_scores: (submission.question_scores as Record<string, number>) || {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const [regradeStatus, setRegradeStatus] = useState<'pending' | 'resolved'>(submission.regrade_request ? 'pending' : 'resolved');

    const rawPercentage = formData.grade ? Math.round((Number(formData.grade) / formData.points_possible) * 100) : 0;
    const finalGrade = Math.max(0, rawPercentage - calculatedPenalty);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const gradeData: Partial<Submission> = {
                grade: Number(formData.grade),
                feedback: formData.feedback,
                late_penalty_applied: calculatedPenalty,
                final_grade: finalGrade,
                response_feedback: formData.response_feedback,
                question_scores: formData.question_scores
            };

            if (submission.regrade_request && regradeStatus === 'resolved') {
                gradeData.regrade_request = null;
                gradeData.feedback = `${formData.feedback}\n\n[Regrade Response]: ${formData.regrade_feedback}`;
            }

            await gradeSubmission(submission.id, gradeData);

            addToast('Grade saved successfully!', 'success');
            onSave();
        } catch (err) {
            console.error('Grading failed:', err);
            addToast('Failed to save grade.', 'error');
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
                        <div className="text-xs text-slate-500 font-medium mt-1">Student: {submission.users?.full_name || 'Anonymous Student'}</div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="bg-blue-50 p-4 md:p-6 rounded-2xl border border-blue-100 space-y-4">
                        <h4 className="text-sm font-bold text-blue-700 uppercase mb-2">Student Submission</h4>

                        {submission.answers && Object.keys(submission.answers).length > 0 ? (
                            <div className="space-y-4">
                                {submission.assignments?.questions.map((q, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100/50 space-y-4">
                                        <div>
                                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Step {idx + 1}: {q.text}</div>
                                            <div className="text-sm text-slate-800">
                                                {q.type === 'file' ? (
                                                    <a href={submission.answers?.[idx] as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">View Uploaded File</a>
                                                ) : (
                                                    (submission.answers?.[idx] as string) || <span className="italic text-slate-400">No response</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-blue-100/50 flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Response Feedback</label>
                                                <input
                                                    type="text"
                                                    value={formData.response_feedback[idx] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        response_feedback: { ...formData.response_feedback, [idx]: e.target.value }
                                                    })}
                                                    placeholder="Provide feedback on this specific response..."
                                                    className="w-full bg-white/80 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Score</label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={formData.question_scores[idx] ?? ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                            const newScores = { ...formData.question_scores, [idx]: val };
                                                            const total = Object.values(newScores).reduce((a: number, b) => a + (b as number), 0);
                                                            setFormData({
                                                                ...formData,
                                                                question_scores: newScores,
                                                                grade: total.toString()
                                                            });
                                                        }}
                                                        className="w-full bg-white/80 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-400 outline-none font-bold"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">/ {q.points}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{submission.submission_text || 'No text provided.'}</div>
                        )}

                        {submission.file_url && (
                            <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-4 text-xs mt-4 block w-fit">View Main Attachment</a>
                        )}
                    </div>

                    {submission.regrade_request && (
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-amber-700 uppercase">Regrade Request</h4>
                                <select
                                    value={regradeStatus}
                                    onChange={(e) => setRegradeStatus(e.target.value as 'pending' | 'resolved')}
                                    className="text-xs font-bold p-1 rounded border border-amber-200 bg-white"
                                >
                                    <option value="pending">Keep Pending</option>
                                    <option value="resolved">Mark Resolved</option>
                                </select>
                            </div>
                            <div className="text-sm text-amber-900 leading-relaxed italic">&ldquo;{submission.regrade_request}&rdquo;</div>

                            {regradeStatus === 'resolved' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-bold text-amber-600 uppercase">Regrade Response</label>
                                    <textarea
                                        value={formData.regrade_feedback}
                                        onChange={(e) => setFormData({...formData, regrade_feedback: e.target.value})}
                                        placeholder="Explain your decision..."
                                        className="w-full p-3 text-sm rounded-xl border border-amber-200 focus:border-amber-500 outline-none transition-all resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Points Earned</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number" required min="0" max={formData.points_possible}
                                    value={formData.grade}
                                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                                    placeholder="0"
                                />
                                <span className="text-lg font-bold text-slate-400">/ {formData.points_possible}</span>
                            </div>
                        </div>
                        <div className="space-y-4 grid grid-cols-2 md:block gap-4">
                            <div>
                                <div className="text-sm font-bold text-blue-600 mb-1 uppercase tracking-tighter">Raw Percentage</div>
                                <div className="text-xl font-bold text-slate-500">
                                    {rawPercentage}%
                                </div>
                            </div>

                            {isLate && (
                                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="text-[10px] font-bold text-red-600 uppercase">Late Submission ({daysLate} days)</div>
                                    <div className="text-lg font-black text-red-700">-{calculatedPenalty}%</div>
                                </div>
                            )}

                            <div>
                                <div className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-tighter">Final Grade</div>
                                <div className="text-3xl font-black text-blue-600">
                                    {finalGrade}%
                                </div>
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
