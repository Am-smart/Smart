"use client";

import React, { useState, useEffect } from 'react';
import { getSystemLogs } from '@/lib/api-actions';
import { SystemInfo } from "@/components/admin/SystemMisc";

export default function SystemPage() {
  const [logs, setLogs] = useState<{id: string, created_at: string, message: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getSystemLogs(50)
      .then(data => setLogs((data as Array<{id: string, created_at: string, message: string}>) || []))
      .catch(err => {
        console.error('Failed to load system logs:', err);
        setError('Failed to load system logs');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="animate-pulse">Loading system info...</div>;

  return (
    <div className="space-y-8">
      <SystemInfo />
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6">Recent System Logs</h3>
        {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono flex gap-4">
              <span className="text-blue-600 shrink-0 font-bold">[{new Date(log.created_at).toLocaleString()}]</span>
              <span className="text-slate-700 break-all">{log.message}</span>
            </div>
          )) : (
            <div className="text-sm text-slate-400 italic p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
              No system logs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
