"use client";

import React from 'react';

export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">{title}</h2>
        <p className="text-slate-500 italic">This administrative module is currently under development. Detailed metrics and controls will be available here.</p>
    </div>
  );
}
