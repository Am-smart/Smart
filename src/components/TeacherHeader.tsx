import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Header } from './ui/Header';
import { useAppContext } from './AppContext';
import { NotificationPanel } from './NotificationPanel';
import { markNotificationAsRead } from '@/lib/data-actions';

interface HeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
}

export const TeacherHeader: React.FC<HeaderProps> = ({ onLogout, onMenuClick }) => {
  const { notifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const rightContent = (
    <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-2xl cursor-pointer p-2 rounded-lg transition-colors hover:bg-[#f1f5f9] relative"
            aria-label="Notifications"
          >
            <Bell size={24} className="text-slate-600" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 bg-[#ef4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
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
          title="Teacher Dashboard"
          onMenuClick={onMenuClick}
          rightContent={rightContent}
      />
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onNotificationClick={handleNotificationClick}
        />
      )}
    </>
  );
};
