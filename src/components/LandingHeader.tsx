import React from 'react';

interface HeaderProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const LandingHeader: React.FC<HeaderProps> = ({ onSignIn, onGetStarted }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-white flex justify-between items-center px-[5%] z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <a href="#" className="text-[1.5rem] font-extrabold text-[#2563eb] flex items-center gap-2"><span>🎓</span> SmartLMS</a>
      <div className="hidden md:flex gap-8">
        <a href="#features" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Features</a>
        <a href="#about" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">About</a>
        <button onClick={onSignIn} className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Sign In</button>
      </div>
      <button onClick={onGetStarted} className="bg-[#2563eb] text-white px-6 py-[0.6rem] rounded-lg font-semibold transition-all hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0">Get Started</button>
    </header>
  );
};
