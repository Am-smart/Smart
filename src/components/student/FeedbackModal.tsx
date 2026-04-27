import React from 'react';
import { SubmissionDTO, AssignmentDTO } from '@/lib/dto/assessment.dto';
import { X, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
    assignment: AssignmentDTO;
    submission: SubmissionDTO;
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ assignment, submission, onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{assignment.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Feedback & Grade</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </header>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Overall Grade Card */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl shadow-blue-500/10">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Performance</div>
                            <div className="text-5xl font-black">{submission.final_grade}%</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Points Earned</div>
                            <div className="text-2xl font-bold text-blue-400">{submission.grade} / {assignment.points_possible}</div>
                        </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle size={14} /> Instructor Comments
                        </h4>
                        <div className="bg-blue-50 text-blue-900 p-6 rounded-2xl border border-blue-100 text-sm leading-relaxed italic">
                            &ldquo;{submission.feedback || 'No overall feedback provided.'}&rdquo;
                        </div>
                    </div>

                    {/* Per-Question Feedback */}
                    {assignment.questions && assignment.questions.length > 0 && (
                        <div className="space-y-6">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Question Breakdown</h4>
                             <div className="space-y-4">
                                {assignment.questions.map((q: any, idx: number) => {
                                    const answer = (submission as any).answers?.[idx];
                                    const feedback = (submission as any).response_feedback?.[idx];
                                    return (
                                        <div key={idx} className="border border-slate-100 rounded-2xl p-6 space-y-4 hover:border-slate-200 transition-colors">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Step {idx + 1}</div>
                                                    <h5 className="font-bold text-slate-800 text-sm">{q.text}</h5>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">{q.points} pts</span>
                                            </div>

                                            <div className="bg-slate-50 rounded-xl p-4">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Your Response</div>
                                                {q.type === 'file' ? (
                                                    <a href={answer as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-bold">
                                                        <FileText size={16} /> View Uploaded File
                                                    </a>
                                                ) : (
                                                    <div className="text-sm text-slate-700">{answer as string || <span className="italic text-slate-400 text-xs">No response provided</span>}</div>
                                                )}
                                            </div>

                                            {feedback && (
                                                <div className="flex gap-3 items-start bg-green-50/50 p-4 rounded-xl border border-green-100">
                                                    <div className="p-1 bg-green-100 text-green-600 rounded-lg shrink-0">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                    <div className="text-xs text-green-800 leading-relaxed font-medium">
                                                        <span className="font-bold uppercase text-[9px] block mb-0.5">Instructor Insight</span>
                                                        {feedback}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    )}
                </div>

                <footer className="p-8 bg-slate-50 border-t flex justify-end shrink-0">
                    <button onClick={onClose} className="btn-primary px-10 py-3 rounded-xl shadow-lg shadow-blue-500/20">Close Feedback</button>
                </footer>
            </div>
        </div>
    );
};
