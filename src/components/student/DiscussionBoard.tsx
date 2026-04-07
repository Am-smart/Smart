import React from 'react';
import { Discussion } from '@/lib/types';

interface DiscussionBoardProps {
  discussions: Discussion[];
  userEmail: string;
  onPost: (content: string, parentId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const DiscussionBoard: React.FC<DiscussionBoardProps> = ({ discussions, userEmail, onPost, onDelete }) => {
  const [newPost, setNewPost] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    await onPost(newPost);
    setNewPost('');
  };

  const renderThread = (parentId: string | null = null, depth = 0) => {
    return discussions
      .filter(d => (parentId === null ? !d.parent_id : d.parent_id === parentId))
      .map(d => (
        <div key={d.id} className={`p-4 rounded-xl border border-slate-100 bg-slate-50 mb-4`} style={{ marginLeft: `${depth * 24}px` }}>
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {d.user_email} • {new Date(d.created_at).toLocaleString()}
            </div>
            {d.user_email === userEmail && (
                <button onClick={() => onDelete(d.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase">Delete</button>
            )}
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">{d.content}</p>
          <div className="mt-4">
             {renderThread(d.id, depth + 1)}
          </div>
        </div>
      ));
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-6">Course Discussion</h3>
      <div className="max-h-[500px] overflow-y-auto mb-8 pr-2">
        {discussions.length > 0 ? renderThread() : <p className="text-slate-500 italic text-center py-8">No messages yet. Start the conversation!</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Start a new thread..."
          className="input-custom flex-1"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <button type="submit" className="btn-primary px-8">Post</button>
      </form>
    </div>
  );
};
