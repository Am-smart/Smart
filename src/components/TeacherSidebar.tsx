import React from 'react';

export const TeacherSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#1e293b] text-white p-6 z-[1000] overflow-y-auto hidden md:block">
      <div className="text-xl font-[800] mb-8 text-[#3b82f6] tracking-tight">SmartLMS</div>
      <nav id="teacherNav" className="space-y-1">
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors bg-[#3b82f6] text-white" data-page="dashboard">🏠 <span>Dashboard</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="courses">📚 <span>Courses</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="materials">📂 <span>Materials</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="assignments">📝 <span>Assignments</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="grading">📊 <span>Grading Queue</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="gradebook">📒 <span>Grade Book</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="students">👥 <span>Students</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="discussions">💬 <span>Discussions</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="calendar">📅 <span>Calendar</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="badges">🏆 <span>Badges</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="quizzes">❓ <span>Quizzes</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="live">📹 <span>Live Classes</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="anti-cheat">🛡️ <span>Anti-Cheat</span></button>
        <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors text-[#94a3b8] hover:bg-[#334155] hover:text-white" data-page="settings">⚙️ <span>Settings</span></button>
      </nav>
    </aside>
  );
};
