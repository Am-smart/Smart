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

export const StudentSidebar = () => {
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
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors bg-[#3b82f6] text-white" data-page="dashboard">🏠 <span>Dashboard</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="courses">🛒 <span>Course Catalog</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="my-courses">📚 <span>My Courses</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="assignments">📝 <span>Assignments</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="quizzes">❓ <span>Quizzes</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="grades">📊 <span>Grades</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="achievements">🏆 <span>Achievements</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="discussions">💬 <span>Discussions</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="calendar">📅 <span>Calendar</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="materials">📚 <span>Materials</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="planner">📅 <span>Planner</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="progress">📈 <span>Progress</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="certificates">📜 <span>Certificates</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="live">📹 <span>Live Classes</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="anti-cheat">🛡️ <span>Anti-Cheat</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="settings">⚙️ <span>Settings</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="help">❓ <span>Help</span></button>
      </nav>
    </aside>
  );
};
