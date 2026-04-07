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
  const { addToQueue, isOnline } = useIndexedDB();

  const { violationCount } = useAntiCheat(assignment.anti_cheat_enabled);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
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
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <header className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{assignment.title}</h2>
            <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase">{assignment.courses?.title || 'Assignment'}</span>
                <span className="text-xs text-slate-500 font-medium">Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
        </header>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-700 uppercase mb-2">Instructions</h4>
            <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{assignment.description}</div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Write your submission</label>
            <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-40 p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Upload evidence / files</label>
            <div className="flex items-center gap-4">
                <label className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                    <div className="text-2xl mb-2">📁</div>
                    <div className="text-xs font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">
                        {fileUrl ? 'File Uploaded ✅' : 'Choose File or Drag & Drop'}
                    </div>
                </label>
                {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary py-3 px-6 text-xs whitespace-nowrap">View File</a>
                )}
            </div>
          </div>
        </div>

        <footer className="p-8 bg-slate-50 border-t flex justify-between items-center">
            <button onClick={onCancel} className="btn-secondary px-8 py-3">Cancel</button>
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!submissionText && !fileUrl)}
                className="btn-primary px-10 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
        </footer>
      </div>
    </div>
  );
};
