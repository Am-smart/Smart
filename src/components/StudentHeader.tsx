import React from 'react';
import { User } from '@/lib/types';

interface HeaderStats {
  courses: number;
  dueSoon: number;
  badges: number;
  unreadNotifications: number;
}

interface HeaderProps {
  user: User;
  stats: HeaderStats;
  onLogout: () => void;
}

export const StudentHeader: React.FC<HeaderProps> = ({ user, stats, onLogout }) => {

export const StudentHeader = () => {
  return (
    <header className="h-[70px] bg-white border-b border-[#e2e8f0] px-8 flex justify-between items-center sticky top-0 z-[900]">
      <div className="flex items-center gap-6">
        <button id="sidebarToggle" className="md:hidden text-2xl p-2 rounded-lg transition-colors hover:bg-[#f1f5f9]">☰</button>
        <div className="text-lg font-bold text-[#1e293b]">Hi, {user.full_name || 'Student'}!</div>
        <div className="text-lg font-bold text-[#1e293b]">Hi, <span id="profileName">Student</span>!</div>
      </div>
      <div className="hidden lg:flex gap-6 items-center">
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
          <div className="text-[#1e293b] font-extrabold text-lg" id="statCourses">0</div>
        </div>
        <div className="text-center px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Due Soon</div>
          <div className="text-[#ef4444] font-extrabold text-lg" id="statDue">0</div>
        </div>
        <div className="text-center px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Level</div>
          <div className="text-[#2563eb] font-extrabold text-lg" id="statLevel">1</div>
        </div>
        <div className="text-center px-4">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Badges</div>
          <div className="text-[#f59e0b] font-extrabold text-lg" id="statBadges">0</div>
        </div>
      </div>
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
