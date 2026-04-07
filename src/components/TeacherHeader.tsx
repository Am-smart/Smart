import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

export const TeacherHeader: React.FC<HeaderProps> = ({ onLogout }) => {
export const TeacherHeader = () => {
  return (
    <header className="h-[70px] bg-white border-b border-[#e2e8f0] px-8 flex justify-between items-center sticky top-0 z-[900]">
      <div className="flex items-center gap-6">
        <button id="sidebarToggle" className="md:hidden text-2xl p-2 rounded-lg transition-colors hover:bg-[#f1f5f9]">☰</button>
        <h1 className="text-lg font-bold text-[#1e293b]">Teacher Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            🔔
          </div>
        </div>
        <button onClick={onLogout} className="bg-[#f1f5f9] text-[#1e293b] px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#e2e8f0]">Logout</button>
          <div id="notifBell" className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            🔔
            <div id="unreadCount" className="absolute top-1 right-1 bg-[#ef4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white hidden">0</div>
          </div>
          <div id="notifList" className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-xl shadow-2xl border border-[#e2e8f0] hidden group-hover:block"></div>
        </div>
        <button id="logoutBtn" className="bg-[#f1f5f9] text-[#1e293b] px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#e2e8f0]">Logout</button>
      </div>
    </header>
  );
};
