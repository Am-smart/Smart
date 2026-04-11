"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Hero } from "@/components/Hero";
import { LandingSections } from "@/components/LandingSections";
import { LandingFooter } from "@/components/LandingFooter";
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useRouter } from 'next/navigation';
import { LandingHeader } from "@/components/LandingHeader";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'reset'>('login');
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
          {authView === 'login' && (
            <LoginForm
              onClose={() => setShowAuth(false)}
              onShowSignup={() => setAuthView('signup')}
              onShowReset={() => setAuthView('reset')}
            />
          )}
          {authView === 'signup' && (
            <SignupForm
              onClose={() => setShowAuth(false)}
              onShowLogin={() => setAuthView('login')}
            />
          )}
          {authView === 'reset' && (
            <ResetPasswordForm
              onClose={() => setShowAuth(false)}
              onShowLogin={() => setAuthView('login')}
            />
          )}
        </div>
      )}
    </div>
  );
}
