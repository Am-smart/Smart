import React from 'react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, rightContent, centerContent }) => {
  return (
    <header className="h-[70px] bg-white border-b border-slate-200 px-4 md:px-8 flex justify-between items-center sticky top-0 z-[900]">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden text-2xl p-2 rounded-lg transition-colors hover:bg-slate-100">☰</button>
        <div className="text-lg font-bold text-slate-800 truncate max-w-[150px] md:max-w-none">{title}</div>
      </div>

      <div className="hidden lg:block">
        {centerContent}
      </div>

      <div className="flex items-center gap-4">
        {rightContent}
      </div>
    </header>
  );
};
