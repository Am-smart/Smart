import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import Script from "next/script";

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" strategy="beforeInteractive" />
      <Script src="/js/supabase-config.js" strategy="afterInteractive" />
      <Script src="/js/core.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />
      <Script src="/js/admin.js" strategy="afterInteractive" />

      <div className="app">
        <AdminSidebar />
        <main className="main ml-0 md:ml-[240px]">
          <AdminHeader />
          <div className="content-area p-8 bg-[#f8fafc] min-h-[calc(100vh-70px)]">
            <div id="maintBanner" className="hidden bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-3 mb-6 text-center text-sm"></div>
            <div id="pageContent">
              {/* Content will be injected by admin.js */}
            </div>
          </div>
        </main>
      </div>

      <div id="modalBackdrop" className="fixed inset-0 bg-black/50 z-[2000] hidden flex items-center justify-center p-4">
        <div id="modal" className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative"></div>
      </div>
    </div>
  );
}
