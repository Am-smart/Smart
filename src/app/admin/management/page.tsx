"use client";

import React from 'react';
import { SystemHealth, SystemInfo } from "@/components/admin/SystemMisc";
import { Shield, Settings, Database } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';

export default function ManagementPage() {
    const { addToast } = useAppContext();
    const handleAction = async (action: string) => {
        const confirmAction = confirm(`Are you sure you want to perform: ${action}?`);
        if (confirmAction) {
            addToast(`${action} completed successfully.`, 'success');
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
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-2">
                                <span>CPU Usage</span>
                                <span>24%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{ width: '24%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-2">
                                <span>Memory (RAM)</span>
                                <span>1.2GB / 4.0GB</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-2">
                                <span>Storage (SSD)</span>
                                <span>42GB / 100GB</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full" style={{ width: '42%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SystemInfo />
        </div>
    );
}
