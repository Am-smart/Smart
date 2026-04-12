import React from 'react';
import { User } from '@/lib/types';

interface UserManagementProps {
  users: User[];
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAdd, onEdit, onDelete }) => {
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
                        <tr key={u.email} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{u.full_name}</td>
                            <td className="px-6 py-4 text-slate-600 text-sm">{u.email}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => onEdit(u)} className="text-blue-600 font-bold text-xs uppercase mr-4">Edit</button>
                                <button onClick={() => onDelete(u.id)} className="text-red-600 font-bold text-xs uppercase">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
