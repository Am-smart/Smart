import React, { useState } from 'react';
import { User, Notification } from '@/lib/types';
import { Bell } from 'lucide-react';
import { Header } from '../ui/Header';
import { NotificationPanel } from './NotificationPanel';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api-actions';

interface HeaderStats {
  courses: number;
  dueSoon: number;
  unreadNotifications: number;
}

interface HeaderProps {
  user: User;
  stats: HeaderStats;
  notifications: Notification[];
  onLogout: () => void;
  onMenuClick: () => void;
}

export const StudentHeader: React.FC<HeaderProps> = ({ user, stats, notifications, onLogout, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const centerContent = (
    <div className="flex gap-6 items-center">
        <div className="text-center px-4 border-r border-[#e2e8f0]">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Courses</div>
          <div className="text-[#1e293b] font-extrabold text-lg">{stats.courses}</div>
        </div>
        <div className="text-center px-4">
          <div className="text-[0.7rem] uppercase font-bold text-[#64748b] tracking-wider mb-1">Due Soon</div>
          <div className="text-[#ef4444] font-extrabold text-lg">{stats.dueSoon}</div>
        </div>
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative"
            aria-label="Notifications"
          >
            <Bell size={24} className="text-slate-600" />
            {stats.unreadNotifications > 0 && (
              <div className="absolute top-1 right-1 bg-[#ef4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                {stats.unreadNotifications}
              </div>
            )}
          </button>
        </div>
        <button onClick={onLogout} className="bg-[#f1f5f9] text-[#1e293b] px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[#e2e8f0]">Logout</button>
    </div>
  );

  return (
    <>
      <Header
          title={`Hi, ${user.full_name || 'Student'}!`}
          onMenuClick={onMenuClick}
          centerContent={centerContent}
          rightContent={rightContent}
      />
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onNotificationClick={handleNotificationClick}
          onClearAll={handleClearAll}
        />
      )}
    </>
  );
};
