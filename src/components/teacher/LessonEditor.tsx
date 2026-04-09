import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Course } from '@/lib/types';
import { Plus, Trash2, GripVertical, Save, X } from 'lucide-react';

interface Lesson {
    id: string;
    course_id: string;
    title: string;
    content: string;
    video_url?: string;
    order_index: number;
}

interface LessonEditorProps {
    course: Course;
    onClose: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ course, onClose }) => {
    const { client } = useSupabase();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newLesson, setNewLesson] = useState({ title: '', content: '', video_url: '' });

    const fetchLessons = useCallback(async () => {
        const { data } = await client.from('lessons').select('*').eq('course_id', course.id).order('order_index', { ascending: true });
        setLessons(data || []);
    }, [client, course.id]);

    useEffect(() => { fetchLessons(); }, [fetchLessons]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await client.from('lessons').insert([{
            ...newLesson,
            course_id: course.id,
            order_index: lessons.length
        }]);
        if (!error) {
            setIsAdding(false);
            setNewLesson({ title: '', content: '', video_url: '' });
            fetchLessons();
        }
    };

    const handleDelete = async (id: string) => {
        await client.from('lessons').delete().eq('id', id);
        fetchLessons();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[4000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Manage Lessons</h2>
                        <p className="text-xs font-medium text-slate-500 mt-1">Course: {course.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Course Content ({lessons.length} Lessons)</h3>
                        {!isAdding && (
                            <button onClick={() => setIsAdding(true)} className="btn-secondary py-2 px-4 text-xs flex items-center gap-2">
                                <Plus size={16} /> Add Lesson
                            </button>
                        )}
                    </div>

                    {isAdding && (
                        <form onSubmit={handleAdd} className="p-6 bg-blue-50/50 rounded-2xl border-2 border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Lesson Title</label>
                                    <input type="text" required value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="input-custom bg-white" placeholder="Introduction to..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Video URL (Optional)</label>
                                    <input type="url" value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} className="input-custom bg-white" placeholder="https://youtube.com/..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Lesson Content</label>
                                    <textarea required value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} className="input-custom bg-white h-32 resize-none" placeholder="Lesson body text..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs flex items-center gap-2"><Save size={14} /> Save Lesson</button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all shadow-sm">
                                <div className="text-slate-300 group-hover:text-blue-400"><GripVertical size={20} /></div>
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs">{idx + 1}</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium truncate max-w-md">{lesson.content}</p>
                                </div>
                                <button onClick={() => handleDelete(lesson.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
