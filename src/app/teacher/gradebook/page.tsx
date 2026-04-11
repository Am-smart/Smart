"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Enrollment } from '@/lib/types';

export default function GradeBookPage() {
  const { user } = useAuth();
  const { client, getCourses } = useSupabase();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (user) {
        getCourses(user.id!).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length > 0) {
                const { data } = await client.from('enrollments').select('*, courses(*), student:users(*)').in('course_id', courseIds);
                setEnrollments(data || []);
            }
        });
    }
  }, [user, getCourses, client]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold">Grade Book</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Course</th>
                        <th className="px-6 py-4">Progress</th>
                        <th className="px-6 py-4">Grade</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {enrollments.map(e => (
                        <tr key={`${e.course_id}-${e.student_id}`}>
                            <td className="px-6 py-4 font-medium">{e.users?.full_name || e.student_id}</td>
                            <td className="px-6 py-4">{e.courses?.title}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: `${e.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold">{e.progress}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">-</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
