import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Course, User } from '@/lib/types';

interface StudentManagementProps {
    teacherEmail: string;
}

interface EnrollmentWithStudent {
    id: string;
    student_email: string;
    course_id: string;
    progress: number;
    courses: Course;
    student: User;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ teacherEmail }) => {
    const [enrollments, setEnrollments] = useState<EnrollmentWithStudent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEnrollments = async () => {
        setIsLoading(true);
        try {
            // Get teacher's courses first
            const { data: courses } = await supabase.from('courses').select('id').eq('teacher_email', teacherEmail);
            const courseIds = courses?.map(c => c.id) || [];

            if (courseIds.length === 0) {
                setEnrollments([]);
                return;
            }

            const { data, error } = await supabase
                .from('enrollments')
                .select('*, courses(*), student:users!student_email(*)')
                .in('course_id', courseIds);

            if (error) throw error;
            setEnrollments((data as unknown as EnrollmentWithStudent[]) || []);
        } catch (err) {
            console.error('Failed to fetch enrollments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, [teacherEmail]);

    const handleUnenroll = async (id: string) => {
        if (!confirm('Are you sure you want to unenroll this student?')) return;
        try {
            const { error } = await supabase.from('enrollments').delete().eq('id', id);
            if (error) throw error;
            fetchEnrollments();
        } catch (err) {
            console.error('Unenroll failed:', err);
        }
    };

    if (isLoading) return <div className="text-center py-10 text-slate-500">Loading students...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-8">Student Management</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Progress</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {enrollments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No students enrolled in your courses yet.</td>
                            </tr>
                        ) : (
                            enrollments.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{e.student?.full_name || e.student_email}</div>
                                        <div className="text-xs text-slate-500">{e.student_email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{e.courses?.title}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[100px]">
                                                <div className="h-full bg-blue-500" style={{ width: `${e.progress}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{e.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleUnenroll(e.id)} className="text-red-500 font-bold text-xs uppercase hover:text-red-700 transition-colors">Unenroll</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
