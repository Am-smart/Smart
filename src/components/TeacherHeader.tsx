import React from 'react';
import { Bell } from 'lucide-react';
import { Header } from './ui/Header';

interface HeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
}

export const TeacherHeader: React.FC<HeaderProps> = ({ onLogout, onMenuClick }) => {
  const rightContent = (
    <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            <Bell size={24} className="text-slate-600" />
          </div>
        </div>
        <button onClick={onLogout} className="bg-[#f1f5f9] text-[#1e293b] px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#e2e8f0]">Logout</button>
    </div>
  );

  return (
    <Header
        title="Teacher Dashboard"
        onMenuClick={onMenuClick}
        rightContent={rightContent}
    />
  );
};
