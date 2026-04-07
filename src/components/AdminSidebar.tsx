import React from 'react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
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
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#1e293b] text-white p-6 z-[1000] overflow-y-auto hidden md:block">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-2xl">⚙️</div>
        <span className="text-lg font-[800] tracking-tight">SmartLMS Admin</span>
      </div>
      <nav id="adminNav" className="space-y-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activePage === item.id ? 'bg-[#2563eb] text-white' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'}`}
          >
            {item.icon} <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
