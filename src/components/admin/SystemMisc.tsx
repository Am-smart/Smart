import React from 'react';
import { User, Activity, Clock } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">System Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><User size={24} /></div>
                        <h3 className="font-bold text-slate-700">User Growth</h3>
                    </div>
                    <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 italic">
                        User growth chart placeholder
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Activity size={24} /></div>
                        <h3 className="font-bold text-slate-700">Active Sessions</h3>
                    </div>
                    <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 italic">
                        Activity heatmap placeholder
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Clock size={24} /></div>
                        <h3 className="font-bold text-slate-700">Server Uptime</h3>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mt-4">99.99%</div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Last 30 days</p>
                </div>
            </div>
        </div>
    );
};

export const SystemHealth: React.FC = () => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">System Health</h2>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Service</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Latency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        <tr>
                            <td className="px-6 py-4 font-bold text-slate-700">Authentication Service</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Operational</span></td>
                            <td className="px-6 py-4 text-slate-500">14ms</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-bold text-slate-700">Database (PostgreSQL)</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Operational</span></td>
                            <td className="px-6 py-4 text-slate-500">8ms</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-bold text-slate-700">File Storage</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Operational</span></td>
                            <td className="px-6 py-4 text-slate-500">42ms</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 font-bold text-slate-700">Realtime Engine</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Operational</span></td>
                            <td className="px-6 py-4 text-slate-500">2ms</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const SystemInfo: React.FC = () => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Environment</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Version</span><span className="font-bold">v2.4.0-stable</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Node.js</span><span className="font-bold">v20.x</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Next.js</span><span className="font-bold">v15.1.7</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Region</span><span className="font-bold">us-east-1</span></div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Database Stats</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Total Records</span><span className="font-bold">128,492</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Storage Used</span><span className="font-bold">428 MB</span></div>
                        <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Active Connections</span><span className="font-bold">14</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Last Backup</span><span className="font-bold">2 hours ago</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
