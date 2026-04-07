import React from 'react';

export const LandingFooter = () => {
  return (
    <footer className="bg-[#0f172a] text-white py-16 px-[5%]">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12 border-b border-[#1e293b] pb-12">
        <div>
          <h4 className="text-2xl font-bold mb-6 text-[#3b82f6]">SmartLMS</h4>
          <p className="text-[#94a3b8] leading-relaxed max-w-sm">Making education accessible and interactive for everyone, everywhere. Start your journey today.</p>
          <div className="flex gap-4 mt-8">
            <a href="https://x.com" target="_blank" className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6]">𝕏</a>
            <a href="https://www.facebook.com" target="_blank" className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6]">𝑓</a>
            <a href="https://www.instagram.com" target="_blank" className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6]">📷</a>
            <a href="https://www.linkedin.com" target="_blank" className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6]">💼</a>
          </div>
        </div>
        <div>
          <h5 className="font-bold text-lg mb-6">Platform</h5>
          <ul className="space-y-4">
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Students</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Teachers</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Admins</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-lg mb-6">Company</h5>
          <ul className="space-y-4">
            <li><a href="#about" className="text-[#94a3b8] hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Support</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-8 text-center text-[#64748b] text-sm">
        &copy; 2024 SmartLMS Platform. All rights reserved.
      </div>
    </footer>
  );
};
