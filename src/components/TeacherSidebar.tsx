import React from 'react';
import { Sidebar, SidebarItem } from './ui/Sidebar';
import {
  LayoutDashboard,
  BookOpen,
  FileCode,
  FileText,
  BarChart3,
  BookMarked,
  Users,
  MessageSquare,
  Calendar,
  Trophy,
  HelpCircle,
  Video,
  ShieldCheck,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const menuItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={20} /> },
    { id: 'materials', label: 'Materials', icon: <FileCode size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={20} /> },
    { id: 'grading', label: 'Grading Queue', icon: <BarChart3 size={20} /> },
    { id: 'gradebook', label: 'Grade Book', icon: <BookMarked size={20} /> },
    { id: 'students', label: 'Students', icon: <Users size={20} /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'badges', label: 'Badges', icon: <Trophy size={20} /> },
    { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={20} /> },
    { id: 'live', label: 'Live Classes', icon: <Video size={20} /> },
    { id: 'anti-cheat', label: 'Anti-Cheat', icon: <ShieldCheck size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <Sidebar
        title="SmartLMS"
        activePage={activePage}
        onNavigate={onNavigate}
        isOpen={isOpen}
        onClose={onClose}
        items={menuItems}
    />
  );
};
