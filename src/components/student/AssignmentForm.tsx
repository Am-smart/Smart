import React, { useState } from 'react';
import { Assignment, User } from '@/lib/types';
import { useSupabase } from '@/hooks/useSupabase';
import { submitAssignment } from '@/lib/data-actions';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';

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
  const [isUploading, setIsUploading] = useState(false);
  const { addToQueue, isOnline } = useIndexedDB();

  const { violationCount } = useAntiCheat(assignment.anti_cheat_enabled, assignment.title);

  // Anti-cheat prevention
  React.useEffect(() => {
    if (assignment.anti_cheat_enabled && violationCount >= 5 && !isSubmitting) {
        addToast('Security Threshold Reached: Assignment locked and auto-submitted due to multiple violations.', 'error', 10000);
        handleSubmit();
    }
  }, [violationCount, assignment.anti_cheat_enabled, isSubmitting, addToast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isOnline) {
        addToast('File upload requires an active internet connection.', 'error');
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `submissions/${user.email}/${fileName}`;

        const { error: uploadError } = await client.storage
            .from('lms-files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = client.storage
            .from('lms-files')
            .getPublicUrl(filePath);

        if (idx !== undefined) {
            setAnswers({ ...answers, [idx]: data.publicUrl });
        } else {
            setFileUrl(data.publicUrl);
        }
    } catch (err) {
        console.error('Upload failed:', err);
        addToast('File upload failed. Please try again.', 'error');
    } finally {
        setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isUploading) return;
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
            await submitAssignment(assignment.id, payload);
            addToast('Assignment submitted successfully!', 'success');
            onComplete(Math.random().toString()); // Placeholder as submitAssignment doesn't return ID yet
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
                    />
                  )}

                  {q.type === 'file' && (
                    <div className="flex flex-col gap-2">
                        <label className={`w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input type="file" onChange={(e) => handleFileUpload(e, idx)} className="hidden" disabled={!isOnline || isUploading} />
                            <div className="text-xs font-bold text-slate-500 uppercase">
                                {isUploading ? 'Uploading...' : answers[idx] ? 'File Uploaded ✅' : 'Click to Upload File'}
                            </div>
                        </label>
                        {answers[idx] && (
                            <a href={answers[idx]} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold uppercase hover:underline">View Uploaded File</a>
                        )}
                    </div>
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
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Upload evidence / files</label>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <label className={`flex-1 w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input type="file" onChange={handleFileUpload} className="hidden" disabled={!isOnline || isUploading} />
                        <div className="text-2xl mb-2">📁</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">
                            {isUploading ? 'Uploading...' : fileUrl ? 'File Uploaded ✅' : isOnline ? 'Choose File' : 'Offline - Upload Disabled'}
                        </div>
                    </label>
                    {fileUrl && (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full md:w-auto py-3 px-6 text-xs whitespace-nowrap">View File</a>
                    )}
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="p-6 md:p-8 bg-slate-50 border-t flex justify-between items-center shrink-0">
            <button onClick={onCancel} className="btn-secondary px-6 md:px-8 py-3 text-sm">Cancel</button>
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading || (!submissionText && !fileUrl)}
                className="btn-primary px-8 md:px-10 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
        </footer>
      </div>
    </div>
  );
};
