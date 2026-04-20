import React, { useState } from 'react';
import { Assignment, User } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';
import { submitAssignment, uploadFile } from '@/lib/data-actions';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';
import { FileUpload } from '@/components/ui/FileUpload';

interface AssignmentFormProps {
  assignment: Assignment;
  user: User;
  onComplete: (submissionId: string) => void;
  onCancel: () => void;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({ assignment, user, onComplete, onCancel }) => {
  const { client } = useSupabase();
  const { addToast } = useAppContext();
  const [submissionText, setSubmissionText] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToQueue, isOnline } = useIndexedDB();

  const { violationCount } = useAntiCheat(assignment.anti_cheat_enabled, assignment.title);

  // Anti-cheat: Feedback and detection
  React.useEffect(() => {
    if (assignment.anti_cheat_enabled && violationCount > 0) {
        addToast(`Security Warning: Violation detected (${violationCount}). This submission has been flagged for review.`, 'info');
    }

    const handleViolation = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (assignment.anti_cheat_enabled && detail) {
            addToast(`Anti-Cheat Alert: ${detail.type} detected!`, 'error');
        }
    };
    window.addEventListener('anti-cheat-violation', handleViolation);
    return () => window.removeEventListener('anti-cheat-violation', handleViolation);
  }, [violationCount, assignment.anti_cheat_enabled, addToast]);

  const performUpload = async (file: File, category: 'materials' | 'submissions' | 'thumbnails') => {
    if (!isOnline) {
      throw new Error('File upload requires an active internet connection.');
    }

    const { filePath } = await uploadFile(file.name, category);
    const { error: uploadError } = await client.storage
        .from('lms-files')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = client.storage
        .from('lms-files')
        .getPublicUrl(filePath);

    return { url: data.publicUrl };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
        const payload = {
            assignment_id: assignment.id,
            student_id: user.id,
            submission_text: submissionText,
            answers,
            file_url: fileUrl || undefined,
            status: 'submitted' as const,
            submitted_at: new Date().toISOString()
        };

        if (isOnline) {
            const res = await submitAssignment(assignment.id, payload);
            addToast('Assignment submitted successfully!', 'success');
            onComplete(res.data?.id || Math.random().toString());
        } else {
            await addToQueue('SUBMISSION', payload, user.sessionId);
            addToast('Offline: Submission queued for synchronization.', 'info');
            onComplete('temp-id');
        }
    } catch (err: unknown) {
        console.error('Failed to submit assignment:', err);
        const msg = err instanceof Error ? err.message : 'Failed to submit assignment. Please try again.';
        addToast(msg, 'error');
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        <header className="p-6 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">{assignment.title}</h2>
            <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase">{assignment.courses?.title || 'Assignment'}</span>
                <span className="text-[10px] text-slate-500 font-medium">Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
        </header>

        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Instructions</h4>
            <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{assignment.description}</div>
          </div>

          {assignment.questions && assignment.questions.length > 0 ? (
            <div className="space-y-8">
              {assignment.questions.map((q, idx) => (
                <div key={idx} className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-800">Step {idx + 1}: {q.text}</h4>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">{q.points} Points</span>
                  </div>

                  {q.type === 'essay' && (
                    <textarea
                      placeholder="Type your response here..."
                      className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                      value={answers[idx] || ''}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                      onPaste={(e) => {
                          if (assignment.anti_cheat_enabled) {
                              e.preventDefault();
                              const event = new CustomEvent('anti-cheat-violation', { detail: { type: 'pasted-content' } });
                              window.dispatchEvent(event);
                          }
                      }}
                    />
                  )}

                  {q.type === 'file' && (
                    <FileUpload
                      category="submissions"
                      uploadFn={performUpload}
                      onUploadComplete={(url) => setAnswers({ ...answers, [idx]: url })}
                      label="Upload Evidence"
                      acceptedTypes={q.extensions ? q.extensions.split(',').map(e => e.trim()) : undefined}
                    />
                  )}

                  {q.type === 'link' && (
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all text-sm"
                      value={answers[idx] || ''}
                      onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Final Comments / Full Submission</label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Provide any final details for your submission..."
                    className="w-full h-40 p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-sm text-slate-700"
                    onPaste={(e) => {
                        if (assignment.anti_cheat_enabled) {
                            e.preventDefault();
                            const event = new CustomEvent('anti-cheat-violation', { detail: { type: 'pasted-content' } });
                            window.dispatchEvent(event);
                        }
                    }}
                  />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Write your submission</label>
                <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-40 p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-sm text-slate-700"
                    onPaste={(e) => {
                        if (assignment.anti_cheat_enabled) {
                            e.preventDefault();
                            const event = new CustomEvent('anti-cheat-violation', { detail: { type: 'pasted-content' } });
                            window.dispatchEvent(event);
                        }
                    }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Upload evidence / files</label>
                <FileUpload
                  category="submissions"
                  uploadFn={performUpload}
                  onUploadComplete={(url) => setFileUrl(url)}
                  label="Drag and drop your submission files here"
                />
              </div>
            </>
          )}
        </div>

        <footer className="p-6 md:p-8 bg-slate-50 border-t flex justify-between items-center shrink-0">
            <button onClick={onCancel} className="btn-secondary px-6 md:px-8 py-3 text-sm">Cancel</button>
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!submissionText && !fileUrl && Object.keys(answers).length === 0)}
                className="btn-primary px-8 md:px-10 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
        </footer>
      </div>
    </div>
  );
};
