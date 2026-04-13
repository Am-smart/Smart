"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { AssignmentEditor } from "@/components/teacher/AssignmentEditor";
import { Assignment, Course } from '@/lib/types';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { getCourses, getAssignments } = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
      if (!user) return;
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const myAssignments = await getAssignments(user.id);
      setAssignments(myAssignments);
  }, [user, getCourses, getAssignments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isAdding || editingAssignment) {
      return (
          <AssignmentEditor
              teacherId={user!.id}
              assignment={editingAssignment || undefined}
              courses={courses}
              onSave={() => { setEditingAssignment(null); setIsAdding(false); fetchData(); }}
              onCancel={() => { setEditingAssignment(null); setIsAdding(false); }}
          />
      );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Assignments</h2>
            <button onClick={() => setIsAdding(true)} className="btn-primary">Create Assignment</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-2">{a.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{a.description}</p>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded uppercase">{a.status}</span>
                        <button onClick={() => setEditingAssignment(a)} className="text-blue-600 font-bold text-sm">Edit</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
