"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Hero } from "@/components/Hero";
import { LandingSections } from "@/components/LandingSections";
import { LandingFooter } from "@/components/LandingFooter";
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { useRouter } from 'next/navigation';
import { LandingHeader } from "@/components/LandingHeader";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const { user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && role) {
      router.push(`/${role}`);
    }
  }, [user, role, router]);

  const toggleAuth = useCallback((view: 'login' | 'signup' = 'login') => {
    setAuthView(view);
    setShowAuth(true);
  }, []);

  return (
    <div className="landing-page">
      <LandingHeader onSignIn={() => toggleAuth('login')} onGetStarted={() => toggleAuth('signup')} />
      <main>
        <Hero onRoleSelect={() => toggleAuth('signup')} />
        <LandingSections />
      </main>
      <LandingFooter onRoleSelect={() => toggleAuth('signup')} />

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
          {authView === 'login' ? (
            <LoginForm
              onClose={() => setShowAuth(false)}
              onShowSignup={() => setAuthView('signup')}
              onShowReset={() => {}}
            />
          ) : (
            <SignupForm
              onClose={() => setShowAuth(false)}
              onShowLogin={() => setAuthView('login')}
            />
          )}
        </div>
      )}
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
