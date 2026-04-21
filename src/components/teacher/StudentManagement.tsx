import React, { useState } from 'react';
import { Enrollment, Course } from '@/lib/types';
import { Award, Trash2, FileBadge, X } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { removeEnrollment, issueCertificate } from '@/lib/data-actions';

interface StudentManagementProps {
    initialEnrollments: Enrollment[];
    courses: Course[];
    onRefresh: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ initialEnrollments, courses, onRefresh }) => {
    const { addToast } = useAppContext();
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [certData, setCertData] = useState({ course_id: '', student_id: '', student_name: '' });

    const handleUnenroll = async (courseId: string, studentId: string) => {
        if (!confirm('Are you sure you want to unenroll this student?')) return;
        try {
            await removeEnrollment(courseId, studentId);
            onRefresh();
            addToast('Student unenrolled successfully', 'success');
        } catch (err) {
            console.error('Unenroll failed:', err);
            addToast('Failed to unenroll student', 'error');
        }
    };

    const handleIssueCert = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await issueCertificate({
                course_id: certData.course_id,
                student_id: certData.student_id,
                certificate_url: `https://lms.example.com/verify/${Math.random().toString(36).substr(2, 12)}`
            });
            addToast(`Certificate issued to ${certData.student_name}!`, 'success');
            setIsCertModalOpen(false);
        } catch (err) {
            console.error('Cert issuance failed:', err);
            addToast('Failed to issue certificate.', 'error');
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-8">Student Management</h2>

            {isCertModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in relative">
                        <button onClick={() => setIsCertModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <FileBadge className="text-blue-600" />
                            Issue Certificate
                        </h3>
                        <form onSubmit={handleIssueCert} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Student</label>
                                <div className="input-custom bg-slate-50 flex items-center">{certData.student_name}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">For Course</label>
                                <select required value={certData.course_id} onChange={e => setCertData({...certData, course_id: e.target.value})} className="input-custom">
                                    <option value="">Select Course...</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsCertModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Issue Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                const student = e.users;
                                return (
                                    <tr key={`${e.course_id}-${e.student_id}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{student?.full_name || 'Unknown Student'}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Joined {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A'}</div>
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
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCertData({ course_id: e.course_id, student_id: e.student_id, student_name: student?.full_name || 'Student' });
                                                        setIsCertModalOpen(true);
                                                    }}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                                    title="Issue Certificate"
                                                >
                                                    <Award size={16} />
                                                </button>
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
