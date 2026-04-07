import React from 'react';
import { User } from '@/lib/types';

interface HeaderStats {
  courses: number;
  dueSoon: number;
  badges: number;
  unreadNotifications: number;
}

import { Header } from './ui/Header';

interface HeaderProps {
  user: User;
  stats: HeaderStats;
  onLogout: () => void;
  onMenuClick: () => void;
}

export const StudentHeader: React.FC<HeaderProps> = ({ user, stats, onLogout, onMenuClick }) => {
  const centerContent = (
    <div className="flex gap-6 items-center">
        <div className="text-center px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Courses</div>
          <div className="text-[#1e293b] font-extrabold text-lg">{stats.courses}</div>
        </div>
        <div className="text-center px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Due Soon</div>
          <div className="text-[#ef4444] font-extrabold text-lg">{stats.dueSoon}</div>
        </div>
        <div className="text-center px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Level</div>
          <div className="text-[#2563eb] font-extrabold text-lg">{user.level || 1}</div>
        </div>
        <div className="text-center px-4">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Badges</div>
          <div className="text-[#f59e0b] font-extrabold text-lg">{stats.badges}</div>
        </div>
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            🔔
            {stats.unreadNotifications > 0 && (
              <div className="absolute top-1 right-1 bg-[#ef4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                {stats.unreadNotifications}
              </div>
            )}
          </div>
        </div>
        <button onClick={onLogout} className="bg-[#f1f5f9] text-[#1e293b] px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#e2e8f0]">Logout</button>
    </div>
  );

  return (
    <Header
        title={`Hi, ${user.full_name || 'Student'}!`}
        onMenuClick={onMenuClick}
        centerContent={centerContent}
        rightContent={rightContent}
    />
  );
};
