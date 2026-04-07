import React from 'react';

interface HeroProps {
  onRoleSelect: (role: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onRoleSelect }) => {
  return (
    <section className="pt-32 pb-20 px-[5%] text-center bg-gradient-to-b from-[#f8fafc] to-white overflow-hidden">
      <div id="maintBanner" className="hidden bg-[#fff7ed] text-[#9a3412] border border-[#ffedd5] rounded-full px-6 py-3 mb-8 mx-auto text-sm max-w-2xl"></div>
      <h1 className="text-4xl md:text-6xl font-[900] text-[#0f172a] mb-6 leading-tight">Modern Learning for Everyone</h1>
      <p className="text-lg md:text-xl text-[#64748b] max-w-3xl mx-auto mb-12 leading-relaxed">Empower your education with our all-in-one learning management system. Collaborative, interactive, and built for results.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-24">
        <div onClick={() => onRoleSelect('student')} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f1f5f9] transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] cursor-pointer">
          <div className="text-4xl mb-4">🧑‍🎓</div>
          <span className="font-bold text-[#334155] text-lg">Student</span>
        </div>
        <div onClick={() => onRoleSelect('teacher')} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f1f5f9] transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] cursor-pointer">
          <div className="text-4xl mb-4">🧑‍🏫</div>
          <span className="font-bold text-[#334155] text-lg">Teacher</span>
        </div>
        <div onClick={() => onRoleSelect('admin')} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f1f5f9] transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] cursor-pointer">
          <div className="text-4xl mb-4">⚙️</div>
          <span className="font-bold text-[#334155] text-lg">Admin</span>
        </div>
      </div>

      <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
        <div className="bg-white p-8 rounded-2xl border border-[#f1f5f9] transition-all hover:border-[#cbd5e1]">
          <div className="bg-[#eff6ff] w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 text-[#2563eb]">📈</div>
          <h3 className="text-xl font-bold text-[#1e293b] mb-4">Progress Tracking</h3>
          <p className="text-[#64748b] leading-relaxed">Monitor your learning journey with advanced analytics and visual progress reports.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-[#f1f5f9] transition-all hover:border-[#cbd5e1]">
          <div className="bg-[#f0fdf4] w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 text-[#22c55e]">💬</div>
          <h3 className="text-xl font-bold text-[#1e293b] mb-4">Interactive Discussions</h3>
          <p className="text-[#64748b] leading-relaxed">Engage with peers and teachers in real-time through course-specific discussion boards.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-[#f1f5f9] transition-all hover:border-[#cbd5e1]">
          <div className="bg-[#fff7ed] w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 text-[#f59e0b]">🏆</div>
          <h3 className="text-xl font-bold text-[#1e293b] mb-4">Gamified Experience</h3>
          <p className="text-[#64748b] leading-relaxed">Earn XP, level up, and collect badges as you complete courses and assignments.</p>
        </div>
      </div>
    </section>
  );
};
