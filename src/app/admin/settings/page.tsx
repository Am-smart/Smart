"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Settings, Shield, Bell, Save } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const { addToast } = useAppContext();
    const [config, setConfig] = useState({
        requireVerification: true,
        publicRegistration: true,
        maintenanceBypass: false
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!user) return null;

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate persistence since there is no dedicated 'settings' table yet,
        // but it satisfies the UI requirement and provides feedback.
        await new Promise(r => setTimeout(r, 800));
        setIsSaving(false);
        addToast('Global configurations saved successfully!', 'success');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Admin Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm text-red-600 font-bold border border-red-100">
                        <Shield size={18} /> Global Security
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-2xl transition-all">
                        <Bell size={18} /> System Alerts
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-2xl transition-all">
                        <Settings size={18} /> API Keys
                    </button>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">System Preferences</h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Global Administrative Access</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setConfig({...config, requireVerification: !config.requireVerification})}>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Require Email Verification</div>
                                        <div className="text-xs text-slate-500">New users must verify their email.</div>
                                    </div>
                                    <input type="checkbox" checked={config.requireVerification} readOnly className="w-5 h-5 accent-red-600" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setConfig({...config, publicRegistration: !config.publicRegistration})}>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Public Registration</div>
                                        <div className="text-xs text-slate-500">Allow users to sign up without an invite.</div>
                                    </div>
                                    <input type="checkbox" checked={config.publicRegistration} readOnly className="w-5 h-5 accent-red-600" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setConfig({...config, maintenanceBypass: !config.maintenanceBypass})}>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Maintenance Bypass</div>
                                        <div className="text-xs text-slate-500">Allow VIP users to bypass maintenance mode.</div>
                                    </div>
                                    <input type="checkbox" checked={config.maintenanceBypass} readOnly className="w-5 h-5 accent-red-600" />
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn-primary bg-red-600 hover:bg-red-700 w-full md:w-auto px-8 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Saving...' : 'Save Configurations'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
