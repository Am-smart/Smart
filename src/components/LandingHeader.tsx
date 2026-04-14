import React from 'react';

interface HeaderProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const LandingHeader: React.FC<HeaderProps> = ({ onSignIn, onGetStarted }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-auto min-h-[60px] sm:h-[70px] bg-white flex justify-between items-center px-3 sm:px-[5%] py-3 sm:py-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <a href="#" className="text-sm sm:text-[1.5rem] font-extrabold text-[#2563eb] flex items-center gap-1 sm:gap-2 whitespace-nowrap">
        <span className="text-lg sm:text-2xl">🎓</span>
        <span className="hidden xs:inline">SmartLMS</span>
      </a>
      <div className="hidden md:flex gap-8">
        <a href="#features" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Features</a>
        <a href="#about" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">About</a>
        <button onClick={onSignIn} className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Sign In</button>
      </div>
      <button onClick={onGetStarted} className="bg-[#2563eb] text-white px-3 sm:px-4 md:px-6 py-2 sm:py-[0.6rem] rounded-lg font-semibold transition-all hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm md:text-base whitespace-nowrap">
        Get Started
      </button>
    </header>
  );
};
