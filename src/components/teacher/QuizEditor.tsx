import React, { useState } from 'react';
import { Quiz, Course, QuizQuestion } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { Plus } from 'lucide-react';
import { saveQuiz } from '@/lib/data-actions';

interface QuizEditorProps {
    teacherId: string;
    quiz?: Quiz;
    courses: Course[];
    onSave: () => void;
    onCancel: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ teacherId, quiz, courses, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const [formData, setFormData] = useState({
        title: quiz?.title || '',
        description: quiz?.description || '',
        course_id: quiz?.course_id || (courses.length > 0 ? courses[0].id : ''),
        time_limit: quiz?.time_limit || 30,
        attempts_allowed: quiz?.attempts_allowed || 1,
        passing_score: quiz?.passing_score || 60,
        start_at: quiz?.start_at ? new Date(quiz.start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        end_at: quiz?.end_at ? new Date(quiz.end_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: quiz?.status || 'draft',
        anti_cheat_enabled: quiz?.anti_cheat_enabled || false,
        auto_submit_enabled: quiz?.auto_submit_enabled || false,
        hard_enforcement: quiz?.hard_enforcement || false,
        questions: (quiz?.questions as QuizQuestion[]) || []
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleAddQuestion = () => {
        const newQ: QuizQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            question_text: '',
            type: 'mcq',
            points: 10,
            options: ['', '', '', ''],
            correct_answer: '',
            hint: '',
            explanation: ''
        };
        setFormData({ ...formData, questions: [...formData.questions, newQ] });
    };

    const handleQuestionChange = (index: number, updates: Partial<QuizQuestion>) => {
        const updated = [...formData.questions];
        updated[index] = { ...updated[index], ...updates };
        setFormData({ ...formData, questions: updated });
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = [...formData.questions];
        updated.splice(index, 1);
        setFormData({ ...formData, questions: updated });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...formData, teacher_id: teacherId, id: quiz?.id };
            await saveQuiz(payload);
            addToast('Quiz saved successfully!', 'success');
            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save quiz.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-bold text-slate-900">{quiz?.id ? 'Edit Quiz' : 'Create New Quiz'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Quiz Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Course</label>
                            <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Start Date</label>
                            <input type="date" required value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">End Date</label>
                            <input type="date" required value={formData.end_at} onChange={e => setFormData({...formData, end_at: e.target.value})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Time Limit (mins)</label>
                            <input type="number" required value={formData.time_limit} onChange={e => setFormData({...formData, time_limit: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Attempts</label>
                            <input type="number" required value={formData.attempts_allowed} onChange={e => setFormData({...formData, attempts_allowed: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div className="sm:col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Quiz['status']})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-3">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                                <input
                                    type="checkbox"
                                    id="anti_cheat"
                                    checked={formData.anti_cheat_enabled}
                                    onChange={e => setFormData({...formData, anti_cheat_enabled: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <label htmlFor="anti_cheat" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Anti-Cheat</label>
                                    <p className="text-[10px] text-slate-500 font-medium">Monitor actions</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                                <input
                                    type="checkbox"
                                    id="auto_submit"
                                    checked={formData.auto_submit_enabled}
                                    onChange={e => setFormData({...formData, auto_submit_enabled: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <label htmlFor="auto_submit" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Auto-Submit</label>
                                    <p className="text-[10px] text-slate-500 font-medium">Auto submit on exit</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border-2 border-red-100">
                                <input
                                    type="checkbox"
                                    id="hard_enforcement"
                                    checked={formData.hard_enforcement}
                                    onChange={e => setFormData({...formData, hard_enforcement: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <div>
                                    <label htmlFor="hard_enforcement" className="block text-sm font-bold text-red-700 uppercase tracking-wide text-red-700">Hard Enforcement</label>
                                    <p className="text-[10px] text-red-500 font-medium">Force submit on 5 violations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 pt-8 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Questions</h3>
                        </div>
                        {formData.questions.map((q, index) => (
                            <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-slate-400 uppercase tracking-widest text-xs">Question {index+1}</div>
                                    <button type="button" onClick={() => handleRemoveQuestion(index)} className="text-red-500 font-bold text-xs uppercase">Remove</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Question Type</label>
                                        <select
                                            value={q.type}
                                            onChange={e => {
                                                const newType = e.target.value as QuizQuestion["type"];
                                                const updates: Partial<QuizQuestion> = { type: newType, correct_answer: '' };
                                                if (newType === 'tf') {
                                                    updates.options = ['True', 'False'];
                                                } else if (newType === 'mcq') {
                                                    updates.options = ['', '', '', ''];
                                                } else {
                                                    updates.options = [];
                                                }
                                                handleQuestionChange(index, updates);
                                            }}
                                            className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white"
                                        >
                                            <option value="mcq">Multiple Choice</option>
                                            <option value="tf">True / False</option>
                                            <option value="short">Short Answer</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Points</label>
                                        <input type="number" value={q.points} onChange={e => handleQuestionChange(index, { points: Number(e.target.value) })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white" />
                                    </div>
                                </div>
                                <input type="text" required value={q.question_text} onChange={e => handleQuestionChange(index, { question_text: e.target.value })} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white" placeholder="Question text..." />

                                {q.type === 'mcq' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {q.options?.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex gap-2">
                                            <input type="text" value={opt} onChange={e => {
                                                const opts = [...(q.options || [])];
                                                opts[optIndex] = e.target.value;
                                                handleQuestionChange(index, { options: opts });
                                            }} className="flex-1 p-3 rounded-xl border border-slate-100 outline-none transition-all focus:border-blue-500 bg-white" placeholder={`Option ${optIndex+1}`} />
                                            <button type="button" onClick={() => handleQuestionChange(index, { correct_answer: opt })} className={`px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest ${q.correct_answer === opt ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Correct</button>
                                        </div>
                                    ))}
                                </div>
                                )}

                                {q.type === 'tf' && (
                                    <div className="flex gap-4">
                                        {['True', 'False'].map(opt => (
                                            <button key={opt} type="button" onClick={() => handleQuestionChange(index, { correct_answer: opt })} className={`flex-1 py-4 rounded-xl font-bold transition-all ${q.correct_answer === opt ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'short' && (
                                    <input type="text" value={q.correct_answer} onChange={e => handleQuestionChange(index, { correct_answer: e.target.value })} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white" placeholder="Correct answer for auto-grading..." />
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Hint (Optional)</label>
                                        <input type="text" value={q.hint || ''} onChange={e => handleQuestionChange(index, { hint: e.target.value })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white" placeholder="Small hint for students..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Explanation (Post-quiz)</label>
                                        <input type="text" value={q.explanation || ''} onChange={e => handleQuestionChange(index, { explanation: e.target.value })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white" placeholder="Explain the correct answer..." />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={handleAddQuestion} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-bold flex items-center justify-center gap-2">
                            <Plus size={18} /> Add Question
                        </button>
                    </div>
                </form>
                <footer className="p-8 border-t bg-slate-50 flex justify-between gap-4 shrink-0">
                    <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-4">Discard</button>
                    <button type="submit" disabled={isSaving || formData.questions.length === 0} onClick={handleSubmit} className="btn-primary flex-1 py-4">{isSaving ? 'Saving...' : 'Save Quiz'}</button>
                </footer>
            </div>
        </div>
    );
};
