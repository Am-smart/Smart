import React from 'react';
import { Bell } from 'lucide-react';
import { Header } from './ui/Header';

interface HeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onLogout, onMenuClick }) => {
  const rightContent = (
    <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            <Bell size={24} className="text-slate-600" />
          </div>
        </div>
        <button onClick={onLogout} className="bg-[#2563eb] text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#1d4ed8]">Logout</button>
    </div>
  );

  return (
    <Header
        title="Admin Dashboard"
        onMenuClick={onMenuClick}
        rightContent={rightContent}
    />
  );
};
