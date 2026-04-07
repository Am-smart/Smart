import React from 'react';
import { Maintenance } from '@/lib/types';

interface MaintenancePanelProps {
  maintenance: Maintenance | null;
  onToggle: (enabled: boolean) => Promise<void>;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ maintenance, onToggle }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold mb-4">System Control</h2>
      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900">Maintenance Mode</h3>
          <p className="text-sm text-slate-500">When enabled, only admins can access the platform.</p>
        </div>
        <button
          onClick={() => onToggle(!maintenance?.enabled)}
          className={`px-6 py-2 rounded-full font-bold text-xs uppercase transition-all ${maintenance?.enabled ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'}`}
        >
          {maintenance?.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {maintenance?.enabled && (
        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm text-amber-700 font-medium">System is currently in maintenance mode. Non-admin users are blocked.</p>
        </div>
      )}
    </div>
  );
};
