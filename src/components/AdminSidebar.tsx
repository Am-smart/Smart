import React from 'react';
import { Sidebar, SidebarItem } from './ui/Sidebar';
import {
  BarChart3,
  RefreshCw,
  Users,
  LineChart,
  ShieldCheck,
  Activity,
  Settings,
  Info
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const menuItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { id: 'resets', label: 'Password Resets', icon: <RefreshCw size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <LineChart size={20} /> },
    { id: 'maintenance', label: 'System & Admin Control', icon: <ShieldCheck size={20} /> },
    { id: 'health', label: 'System Health', icon: <Activity size={20} /> },
    { id: 'management', label: 'System Management', icon: <Settings size={20} /> },
    { id: 'settings', label: 'Admin Settings', icon: <Settings size={20} /> },
    { id: 'system', label: 'System Info', icon: <Info size={20} /> },
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
