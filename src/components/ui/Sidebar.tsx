import React from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  items: SidebarItem[];
  title: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose, items, title }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[1000] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-[#1e293b] text-white p-6 z-[1001] overflow-y-auto transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-xl font-[800] text-[#3b82f6] tracking-tight">{title}</div>
          <button onClick={onClose} className="md:hidden text-2xl text-slate-400">✕</button>
        </div>
        <nav className="space-y-1">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activePage === item.id ? 'bg-[#3b82f6] text-white' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
