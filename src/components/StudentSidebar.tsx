import React from 'react';

import { Sidebar } from './ui/Sidebar';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'courses', label: 'Course Catalog', icon: '🛒' },
    { id: 'my-courses', label: 'My Courses', icon: '📚' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'quizzes', label: 'Quizzes', icon: '❓' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'discussions', label: 'Discussions', icon: '💬' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'materials', label: 'Materials', icon: '📚' },
    { id: 'planner', label: 'Planner', icon: '📅' },
    { id: 'certificates', label: 'Certificates', icon: '📜' },
    { id: 'live', label: 'Live Classes', icon: '📹' },
    { id: 'anti-cheat', label: 'Anti-Cheat', icon: '🛡️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'help', label: 'Help', icon: '❓' },
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
