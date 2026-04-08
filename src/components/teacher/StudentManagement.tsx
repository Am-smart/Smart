import React from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Enrollment } from '@/lib/types';

interface StudentManagementProps {
    initialEnrollments: Enrollment[];
    onRefresh: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ initialEnrollments, onRefresh }) => {
    const { client } = useSupabase();

    const handleUnenroll = async (id: string) => {
        if (!confirm('Are you sure you want to unenroll this student?')) return;
        try {
            const { error } = await client.from('enrollments').delete().eq('id', id);
            if (error) throw error;
            onRefresh();
        } catch (err) {
            console.error('Unenroll failed:', err);
        }
    };

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
                        {initialEnrollments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No students enrolled in your courses yet.</td>
                            </tr>
                        ) : (
                            initialEnrollments.map(e => {
                                const student = e.student;
                                return (
                                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{student?.full_name || e.student_email}</div>
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
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
