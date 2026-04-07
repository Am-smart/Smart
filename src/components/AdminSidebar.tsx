import React from 'react';

import { Sidebar } from './ui/Sidebar';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'resets', label: 'Password Resets', icon: '🔄' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'maintenance', label: 'System & Admin Control', icon: '🛡️' },
    { id: 'health', label: 'System Health', icon: '🏥' },
    { id: 'management', label: 'System Management', icon: '⚙️' },
    { id: 'settings', label: 'Admin Settings', icon: '⚙️' },
    { id: 'system', label: 'System Info', icon: 'ℹ️' },
  ];

  return (
    <Sidebar
        title="SmartLMS Admin"
        activePage={activePage}
        onNavigate={onNavigate}
        isOpen={isOpen}
        onClose={onClose}
        items={menuItems}
    />
  );
};
