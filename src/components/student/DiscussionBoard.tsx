import React from 'react';
import { Discussion } from '@/lib/types';

interface DiscussionBoardProps {
  userId: string;
  discussions: Discussion[];

  onPost: (content: string, parentId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isOnline: boolean;
}

export const DiscussionBoard: React.FC<DiscussionBoardProps> = ({ discussions, userId, onPost, onDelete, isOnline }) => {
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
              {d.users?.full_name || d.user_id} • {new Date(d.created_at).toLocaleString()}
            </div>
            {d.user_id === userId && (
                <button onClick={() => onDelete(d.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase">Delete</button>
            )}
          </div>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{d.content}</p>
          <div className="mt-4">
             {renderThread(d.id, depth + 1)}
          </div>
        </div>
      ));
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Course Discussion</h3>
        {!isOnline && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">Offline Mode</span>
        )}
      </div>
      <div className="max-h-[500px] overflow-y-auto mb-8 pr-2">
        {discussions.length > 0 ? renderThread() : <p className="text-slate-500 italic text-center py-8">No messages yet. Start the conversation!</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder={isOnline ? "Start a new thread..." : "Posting is disabled while offline"}
          className="input-custom flex-1"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          disabled={!isOnline}
        />
        <button type="submit" disabled={!isOnline || !newPost.trim()} className="btn-primary px-8 py-3 md:py-2">Post Message</button>
      </form>
    </div>
  );
};
