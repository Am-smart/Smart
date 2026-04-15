import React from 'react';
import { Bell } from 'lucide-react';
import { Header } from './ui/Header';
import { useAppContext } from './AppContext';

interface HeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onLogout, onMenuClick }) => {
  const { notifications } = useAppContext();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const rightContent = (
    <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative">
            <Bell size={24} className="text-slate-600" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 bg-[#ef4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </div>
            )}
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
