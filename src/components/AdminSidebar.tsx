import React from 'react';

export const AdminSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#1e293b] text-white p-6 z-[1000] overflow-y-auto hidden md:block">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-2xl">⚙️</div>
        <span className="text-lg font-[800] tracking-tight">SmartLMS Admin</span>
      </div>
      <nav id="adminNav" className="space-y-1">
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors bg-[#2563eb] text-white" data-page="dashboard">📊 <span>Dashboard</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="resets">🔄 <span>Password Resets</span> <span id="resetBadge" className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full hidden">-</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="users">👥 <span>Users</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="analytics">📈 <span>Analytics</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="maintenance">🛡️ <span>System & Admin Control</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="health">🏥 <span>System Health</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="management">⚙️ <span>System Management</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="settings">⚙️ <span>Admin Settings</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="system">ℹ️ <span>System Info</span></button>
      </nav>
    </aside>
  );
};
