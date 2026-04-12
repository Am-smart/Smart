"use client";

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { SystemInfo } from "@/components/admin/SystemMisc";

export default function SystemPage() {
  const { client } = useSupabase();
  const [logs, setLogs] = useState<{id: string, created_at: string, message: string}[]>([]);

  useEffect(() => {
    client.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50).then(r => setLogs(r.data || []));
  }, [client]);

  return (
    <div className="space-y-8">
        <SystemInfo />
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Recent System Logs</h3>
            <div className="space-y-2">
                {logs.map((log) => (
                    <div key={log.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-100 font-mono">
                        <span className="text-blue-600">[{new Date(log.created_at).toLocaleString()}]</span> {log.message}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
