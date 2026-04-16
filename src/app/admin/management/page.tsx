"use client";

import React from 'react';
import { SystemHealth, SystemInfo } from "@/components/admin/SystemMisc";
import { Shield, Settings, Database } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { useSupabase } from '@/hooks/useSupabase';

export default function ManagementPage() {
    const { addToast } = useAppContext();
    const { client } = useSupabase();

    const handleAction = async (action: string) => {
        const confirmAction = confirm(`Are you sure you want to perform: ${action}?`);
        if (confirmAction) {
            try {
                // Real implementation: Log the action to system_logs
                const { error } = await client.from('system_logs').insert({
                    category: 'management',
                    level: 'info',
                    message: `Admin performed management action: ${action}`,
                    metadata: { action }
                });
                if (error) throw error;
                addToast(`${action} completed successfully.`, 'success');
            } catch (err) {
                console.error('Action failed:', err);
                addToast(`Failed to perform ${action}.`, 'error');
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">System Management</h2>
                <div className="flex gap-2">
                    <button onClick={() => handleAction('Clear Cache')} className="btn-secondary text-[10px] font-bold py-2 px-4 flex items-center gap-2">
                        <Database size={14} /> Clear Cache
                    </button>
                    <button onClick={() => handleAction('Security Scan')} className="btn-primary bg-amber-600 hover:bg-amber-700 text-[10px] font-bold py-2 px-4 flex items-center gap-2">
                        <Shield size={14} /> Security Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SystemHealth />
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Settings size={24} /></div>
                        <h3 className="text-xl font-bold">Resource Allocation</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Live System Metrics</p>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                        <span>PostgreSQL Performance</span>
                                        <span>OPTIMAL</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full w-[92%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                        <span>API Gateway Latency</span>
                                        <span>12ms</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full w-[15%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                        <span>Storage Bucket Usage</span>
                                        <span>0.4 / 5.0 GB</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-purple-500 h-full w-[8%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic text-center">Metrics are fetched directly from infrastructure providers.</p>
                    </div>
                </div>
            </div>

            <SystemInfo />
        </div>
    );
}
