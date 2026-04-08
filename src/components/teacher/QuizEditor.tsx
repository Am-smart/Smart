import React, { useState } from 'react';
import { Quiz, Course, QuizQuestion } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';

interface QuizEditorProps {
    quiz?: Quiz;
    courses: Course[];
    onSave: () => void;
    onCancel: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, courses, onSave, onCancel }) => {
    const { client } = useSupabase();
    const [formData, setFormData] = useState({
        title: quiz?.title || '',
        description: quiz?.description || '',
        course_id: quiz?.course_id || (courses.length > 0 ? courses[0].id : ''),
        time_limit: quiz?.time_limit || 30,
        attempts_allowed: quiz?.attempts_allowed || 1,
        status: quiz?.status || 'draft',
        anti_cheat_enabled: quiz?.anti_cheat_enabled || false,
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
            correct_answer: ''
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
            const { error } = quiz?.id
                ? await client.from('quizzes').update(formData).eq('id', quiz.id)
                : await client.from('quizzes').insert([formData]);
            if (error) throw error;
            onSave();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save quiz.');
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
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-6">
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
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Time Limit (mins)</label>
                            <input type="number" required value={formData.time_limit} onChange={e => setFormData({...formData, time_limit: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Attempts</label>
                            <input type="number" required value={formData.attempts_allowed} onChange={e => setFormData({...formData, attempts_allowed: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Quiz['status']})} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-8 pt-8 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Questions</h3>
                            <button type="button" onClick={handleAddQuestion} className="btn-secondary py-2 px-6">+ Add Question</button>
                        </div>
                        {formData.questions.map((q, index) => (
                            <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-slate-400 uppercase tracking-widest text-xs">Question {index+1}</div>
                                    <button type="button" onClick={() => handleRemoveQuestion(index)} className="text-red-500 font-bold text-xs uppercase">Remove</button>
                                </div>
                                <input type="text" required value={q.question_text} onChange={e => handleQuestionChange(index, { question_text: e.target.value })} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white" placeholder="Question text..." />
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
                            </div>
                        ))}
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
