import React from 'react';

import { Sidebar } from './ui/Sidebar';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'materials', label: 'Materials', icon: '📂' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'grading', label: 'Grading Queue', icon: '📊' },
    { id: 'gradebook', label: 'Grade Book', icon: '📒' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'discussions', label: 'Discussions', icon: '💬' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'badges', label: 'Badges', icon: '🏆' },
    { id: 'quizzes', label: 'Quizzes', icon: '❓' },
    { id: 'live', label: 'Live Classes', icon: '📹' },
    { id: 'anti-cheat', label: 'Anti-Cheat', icon: '🛡️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
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
