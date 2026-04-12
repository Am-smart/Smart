"use client";

import React from 'react';

export default function HelpPage() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">Help & Support</h2>
        <div className="space-y-4 text-slate-600">
            <p>Welcome to SmartLMS Help Center. If you have any questions or encounter issues, please check the resources below.</p>
            <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-slate-900 mb-2">Getting Started</h3>
                <p className="text-sm">Learn how to navigate your dashboard, enroll in courses, and track your progress.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-slate-900 mb-2">Contact Support</h3>
                <p className="text-sm">Reach out to our technical team for assistance with your account or the platform.</p>
            </div>
        </div>
    </div>
  );
}
