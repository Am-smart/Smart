"use client";

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { User } from '@/lib/types';
import { Key, Check, X } from 'lucide-react';

export const PasswordResetManager: React.FC = () => {
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const client = createSupabaseClient();
    const { data } = await client
      .from('users')
      .select('*')
      .not('reset_request', 'is', null);

    setRequests((data || []) as User[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResolve = async (userId: string) => {
    const client = createSupabaseClient();
    await client.from('users').update({ reset_request: null }).eq('id', userId);
    fetchRequests();
  };

  if (loading) return <div>Loading reset requests...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Key size={20} className="text-amber-500" />
          Password Reset Requests
        </h3>
        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
          {requests.length} Pending
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Requested At</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {requests.length === 0 ? (
                <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No pending reset requests</td>
                </tr>
            ) : requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{req.full_name}</div>
                  <div className="text-xs text-slate-500">{req.email}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {req.reset_request && new Date((req.reset_request as { requested_at: string }).requested_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                        onClick={() => handleResolve(req.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as Resolved"
                    >
                      <Check size={18} />
                    </button>
                    <button
                        onClick={() => handleResolve(req.id)}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Dismiss"
                    >
                      <X size={18} />
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
