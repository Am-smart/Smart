import { LandingHeader } from "@/components/LandingHeader";
import { Hero } from "@/components/Hero";
import { LandingSections } from "@/components/LandingSections";
import { LandingFooter } from "@/components/LandingFooter";
import { AuthOverlay } from "@/components/AuthOverlay";
import Script from "next/script";

export default function Home() {
  return (
    <div className="landing-page">
      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" strategy="beforeInteractive" />
      <Script src="/js/supabase-config.js" strategy="afterInteractive" />
      <Script src="/js/core.js" strategy="afterInteractive" />
      <Script src="/js/auth.js" strategy="afterInteractive" />

      <LandingHeader />
      <main>
        <Hero />
        <LandingSections />
      </main>
      <LandingFooter />
      <AuthOverlay />
    </div>
  );
}
