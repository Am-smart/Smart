import React, { useState } from 'react';
import { Assignment, User } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';

interface AssignmentFormProps {
  assignment: Assignment;
  user: User;
  onComplete: (submissionId: string) => void;
  onCancel: () => void;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({ assignment, user, onComplete, onCancel }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addToQueue, isOnline } = useIndexedDB();

  useAntiCheat(assignment.anti_cheat_enabled);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isOnline) {
        alert('File upload requires an active internet connection. Please try again when online.');
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `submissions/${user.email}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('lms-files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('lms-files')
            .getPublicUrl(filePath);

        setFileUrl(data.publicUrl);
    } catch (err) {
        console.error('Upload failed:', err);
        alert('File upload failed. Please try again.');
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
            student_email: user.email,
            submission_text: submissionText,
            file_url: fileUrl,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        };

        if (isOnline) {
            const { data, error } = await supabase.from('submissions').insert([payload]).select().single();
            if (error) throw error;
            onComplete(data.id);
        } else {
            await addToQueue('SUBMISSION', payload);
            alert('Offline: Submission queued for sync.');
            onComplete('temp-id');
        }
    } catch (err) {
        console.error('Failed to submit assignment:', err);
        alert('Failed to submit assignment. Please try again.');
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

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Instructions</h4>
            <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{assignment.description}</div>
          </div>

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
