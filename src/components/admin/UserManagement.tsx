import React from 'react';
import { User } from '@/lib/types';

interface UserManagementProps {
  users: User[];
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<User>) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAdd, onEdit, onDelete, onUpdate }) => {
  const handleLock = async (id: string, minutes: number) => {
    const lockedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    await onUpdate(id, { locked_until: lockedUntil, lockouts: (users.find(u => u.id === id)?.lockouts || 0) + 1 });
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">User Management</h2>
            <button onClick={onAdd} className="btn-primary py-2 px-6">Add User</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{u.full_name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{u.id}</div>
                                <div className="flex gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${u.role === 'admin' ? 'bg-red-500 text-white' : u.role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}>
                                        {u.role}
                                    </span>
                                    {u.flagged && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white animate-pulse">Flagged</span>}
                                    {!u.active && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-400 text-white">Deactivated</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-600">{u.email}</div>
                                <div className="text-[10px] text-slate-400 mt-1">Phone: {u.phone || 'N/A'}</div>
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Password: [ENCRYPTED]</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Attempts: <span className="text-slate-900">{u.failed_attempts || 0}</span></div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Lockouts: <span className="text-slate-900">{u.lockouts || 0}</span></div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Joined: <span className="text-slate-900">{new Date(u.created_at).toLocaleDateString()}</span></div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                    <button onClick={() => onEdit(u)} className="btn-secondary text-[9px] py-1 px-3">Edit</button>
                                    <button onClick={() => onDelete(u.id)} className="btn-secondary text-[9px] py-1 px-3 text-red-600">Delete</button>
                                </div>
                                <div className="flex flex-wrap justify-end gap-1 mt-2">
                                    <button onClick={() => handleLock(u.id, 30)} className="text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600">Lock 30m</button>
                                    <button onClick={() => handleLock(u.id, 1440)} className="text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600">Lock 24h</button>
                                    <button onClick={() => onUpdate(u.id, { locked_until: null, failed_attempts: 0 })} className="text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-green-600">Unlock</button>
                                    <button onClick={() => onUpdate(u.id, { flagged: !u.flagged })} className={`text-[8px] font-bold uppercase tracking-wider ${u.flagged ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'}`}>
                                        {u.flagged ? 'Unflag' : 'Flag'}
                                    </button>
                                    <button onClick={() => onUpdate(u.id, { active: !u.active })} className={`text-[8px] font-bold uppercase tracking-wider ${u.active ? 'text-slate-400 hover:text-red-600' : 'text-green-600'}`}>
                                        {u.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
