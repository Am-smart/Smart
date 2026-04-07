import React from 'react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const StudentSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
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
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#1e293b] text-white p-6 z-[1000] overflow-y-auto hidden md:block">
      <div className="text-xl font-[800] mb-8 text-[#3b82f6] tracking-tight">SmartLMS</div>
      <nav id="studentNav" className="space-y-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activePage === item.id ? 'bg-[#3b82f6] text-white' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'}`}
          >
            {item.icon} <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
