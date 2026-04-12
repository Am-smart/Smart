"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { QuizEditor } from "@/components/teacher/QuizEditor";
import { Quiz, Course } from '@/lib/types';

export default function QuizzesPage() {
  const { user } = useAuth();
  const { getCourses, getQuizzes } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
      if (!user) return;
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const myQuizzes = await getQuizzes(undefined, user.id);
      setQuizzes(myQuizzes);
  }, [user, getCourses, getQuizzes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isAdding || editingQuiz) {
      return (
          <QuizEditor
              teacherId={user!.id}
              quiz={editingQuiz || undefined}
              courses={courses}
              onSave={() => { setEditingQuiz(null); setIsAdding(false); fetchData(); }}
              onCancel={() => { setEditingQuiz(null); setIsAdding(false); }}
          />
      );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quizzes</h2>
            <button onClick={() => setIsAdding(true)} className="btn-primary">Create Quiz</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(q => (
                <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-2">{q.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{q.description}</p>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded uppercase">{q.status}</span>
                        <button onClick={() => setEditingQuiz(q)} className="text-blue-600 font-bold text-sm">Edit</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
