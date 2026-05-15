import React, { useState } from 'react';
import { SubmissionDTO } from '@/lib/types';
import { Clock, RotateCcw, User, FileText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

interface GradingQueueProps {
  submissions: SubmissionDTO[];
  onGrade: (submission: SubmissionDTO) => void;
}

const ITEMS_PER_PAGE = 10;

export const GradingQueue: React.FC<GradingQueueProps> = ({ submissions, onGrade }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Pending grading includes new submissions and regrade requests
  const pending = submissions.filter(s => s.status === 'submitted' || !!s.regrade_request);

  const totalPages = Math.ceil(pending.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPending = pending.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Grading Queue</h2>
        <div className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
            {pending.length} Submissions Pending
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <div className="min-w-[800px]">
                {/* Header */}
                <div className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 flex">
                    <div className="px-8 py-5 flex-1">Student Information</div>
                    <div className="px-8 py-5 flex-1">Assignment Content</div>
                    <div className="px-8 py-5 flex-1">Request Type</div>
                    <div className="px-8 py-5 text-right w-48">Actions</div>
                </div>

                {/* Body */}
                <div className="divide-y divide-slate-100">
                    {pending.length === 0 ? (
                        <div className="px-8 py-20 text-center text-slate-400 italic font-medium">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                    <CheckCircle2 size={32} className="text-slate-200" />
                                </div>
                                <p>Everything is caught up! No pending submissions to grade.</p>
                            </div>
                        </div>
                    ) : (
                        <List
                            height={Math.min(paginatedPending.length * 100, 500)}
                            itemCount={paginatedPending.length}
                            itemSize={100}
                            width="100%"
                        >
                            {({ index, style }) => {
                                const sub = paginatedPending[index];
                                return (
                                    <div style={style} className="flex items-center hover:bg-slate-50/30 transition-colors group border-b border-slate-50 last:border-0">
                                        <div className="px-8 py-6 flex-1">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{sub.student?.full_name || 'Anonymous Student'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Submitted: {new Date(sub.submitted_at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-8 py-6 flex-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <FileText size={14} className="text-slate-400" />
                                                {sub.assignment?.title || 'Unknown Assignment'}
                                            </div>
                                            <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 italic">
                                                Course ID: {sub.assignment?.course_id.substring(0, 8)}...
                                            </div>
                                        </div>
                                        <div className="px-8 py-6 flex-1">
                                            {sub.regrade_request ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border border-amber-200">
                                                        <RotateCcw size={12} /> Regrade Request
                                                    </span>
                                                    <p className="text-[10px] text-slate-500 italic line-clamp-1 max-w-[200px]">"{sub.regrade_request}"</p>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border border-blue-100">
                                                    <Clock size={12} /> Initial Grading
                                                </span>
                                            )}
                                        </div>
                                        <div className="px-8 py-6 text-right w-48">
                                            <button
                                                onClick={() => onGrade(sub)}
                                                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${
                                                    sub.regrade_request ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600' : 'bg-slate-900 text-white shadow-slate-100 hover:bg-slate-800'
                                                }`}
                                            >
                                                <CheckCircle2 size={16} />
                                                Grade Now
                                            </button>
                                        </div>
                                    </div>
                                );
                            }}
                        </List>
                    )}
                </div>
            </div>
        </div>

        {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, pending.length)} of {pending.length}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center px-4 text-xs font-bold text-slate-700">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
