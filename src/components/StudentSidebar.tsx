import React from 'react';
import { Sidebar, SidebarItem } from './ui/Sidebar';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  FileText,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Calendar,
  FileCode,
  Video,
  ShieldCheck,
  Settings,
  CircleHelp
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  // Normalize activePage for sidebar highlighting
  const normalizedActivePage = activePage.split('/')[0];

  const menuItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Course Catalog', icon: <BookOpen size={20} /> },
    { id: 'my-courses', label: 'My Courses', icon: <Library size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={20} /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'materials', label: 'Materials', icon: <FileCode size={20} /> },
    { id: 'planner', label: 'Planner', icon: <Calendar size={20} /> },
    { id: 'live', label: 'Live Classes', icon: <Video size={20} /> },
    { id: 'anti-cheat', label: 'Anti-Cheat', icon: <ShieldCheck size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    { id: 'help', label: 'Help', icon: <CircleHelp size={20} /> },
  ];

  return (
    <Sidebar
      title="SmartLMS"
        activePage={normalizedActivePage}
      onNavigate={onNavigate}
      isOpen={isOpen}
      onClose={onClose}
      items={menuItems}
    />
  );
};
