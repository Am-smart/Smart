import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="h-[70px] bg-white border-b border-[#e2e8f0] px-8 flex justify-between items-center sticky top-0 z-[900]">
      <div className="flex items-center gap-6">
        <button id="sidebarToggle" className="md:hidden text-2xl p-2 rounded-lg transition-colors hover:bg-[#f1f5f9]">☰</button>
        <div className="text-lg font-bold text-[#1e293b]">Admin Dashboard</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            🔔
          </div>
        </div>
        <button onClick={onLogout} className="bg-[#2563eb] text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#1d4ed8]">Logout</button>
      </div>
    </header>
  );
};
