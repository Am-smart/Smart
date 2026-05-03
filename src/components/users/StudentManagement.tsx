import React from 'react';
import { EnrollmentDTO } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { unenrollStudent } from '@/lib/api-actions';

interface StudentManagementProps {
    initialEnrollments: EnrollmentDTO[];
    onRefresh: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ initialEnrollments, onRefresh }) => {
    const { addToast } = useAppContext();

    const handleUnenroll = async (courseId: string, studentId: string) => {
        if (!confirm('Are you sure you want to unenroll this student?')) return;
        try {
            const res = await unenrollStudent(courseId, studentId);
            if (!res.success) throw new Error(res.error);
            onRefresh();
            addToast('Student unenrolled successfully', 'success');
        } catch (err) {
            console.error('Unenroll failed:', err);
            addToast('Failed to unenroll student', 'error');
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-8">Student Management</h2>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Progress</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialEnrollments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No students enrolled yet.</td>
                            </tr>
                        ) : (
                            initialEnrollments.map(e => {
                                const student = e.student;
                                return (
                                    <tr key={`${e.course_id}-${e.student_id}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{student?.full_name || 'Unknown Student'}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Joined {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{e.course?.title}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[100px]">
                                                    <div className="h-full bg-blue-500" style={{ width: `${e.progress}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-slate-900">{e.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleUnenroll(e.course_id, e.student_id)}
                                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                                    title="Unenroll Student"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
