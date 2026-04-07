import { TeacherSidebar } from "@/components/TeacherSidebar";
import { TeacherHeader } from "@/components/TeacherHeader";
import Script from "next/script";

export default function TeacherDashboard() {
  return (
    <div className="teacher-dashboard">
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" strategy="beforeInteractive" />
      <Script src="/js/supabase-config.js" strategy="afterInteractive" />
      <Script src="/js/core.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
      <Script src="https://meet.jit.si/external_api.js" strategy="afterInteractive" />
      <Script src="/calendar_logic.js" strategy="afterInteractive" />
      <Script src="/js/anti-cheat.js" strategy="afterInteractive" />
      <Script src="/js/teacher.js" strategy="afterInteractive" />

      <div className="app">
        <TeacherSidebar />
        <main className="main ml-0 md:ml-[240px]">
          <TeacherHeader />
          <div className="content-area p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="maintBanner" className="hidden bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-3 mb-4 text-center text-sm"></div>
            <div id="pageContent">
              {/* Content will be injected by teacher.js */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
