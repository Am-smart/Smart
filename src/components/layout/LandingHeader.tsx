import React, { useState } from 'react';

interface HeaderProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const LandingHeader: React.FC<HeaderProps> = ({ onSignIn, onGetStarted }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (callback?: () => void) => {
    setMobileMenuOpen(false);
    if (callback) callback();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-auto min-h-[60px] sm:h-[70px] bg-white flex justify-between items-center px-3 sm:px-[5%] py-3 sm:py-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <a href="#" className="text-sm sm:text-[1.5rem] font-extrabold text-[#2563eb] flex items-center gap-1 sm:gap-2 whitespace-nowrap">
        <span className="text-lg sm:text-2xl">🎓</span>
        <span className="hidden xs:inline">SmartLMS</span>
      </a>
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8">
        <a href="#features" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Features</a>
        <a href="#about" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">About</a>
        <button onClick={onSignIn} className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Sign In</button>
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Get Started Button */}
      <button 
        onClick={onGetStarted}
        className="hidden sm:block bg-[#2563eb] text-white px-3 sm:px-4 md:px-6 py-2 sm:py-[0.6rem] rounded-lg font-semibold transition-all hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm md:text-base whitespace-nowrap"
      >
        Get Started
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 md:hidden shadow-lg">
          <nav className="flex flex-col gap-0">
            <a 
              href="#features" 
              onClick={() => handleNavClick()}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100"
            >
              Features
            </a>
            <a 
              href="#about"
              onClick={() => handleNavClick()}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100"
            >
              About
            </a>
            <button 
              onClick={() => handleNavClick(onSignIn)}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100 text-left"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleNavClick(onGetStarted)}
              className="bg-[#2563eb] text-white px-4 py-3 font-semibold transition-all hover:bg-[#1d4ed8] text-left text-sm"
            >
              Get Started
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
