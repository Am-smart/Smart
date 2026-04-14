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
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth has finished loading and user is authenticated
    if (!isLoading && user && role) {
      // Use router.push instead of router.replace for better handling
      router.push(`/${role}`);
    }
  }, [user, role, isLoading, router]);

  const toggleAuth = useCallback((view: 'login' | 'signup' = 'login', initialRole?: 'student' | 'teacher' | 'admin') => {
    setAuthView(view);
    if (initialRole) setSelectedRole(initialRole);
    setShowAuth(true);
  }, []);

  return (
    <div className="landing-page">
      <LandingHeader onSignIn={() => toggleAuth('login')} onGetStarted={() => toggleAuth('signup')} />
      <main>
        <Hero onRoleSelect={(r) => toggleAuth('signup', r)} />
        <LandingSections />
      </main>
      <LandingFooter onRoleSelect={(r) => toggleAuth('signup', r)} />

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full py-4 sm:py-8">
            {authView === 'login' && (
              <LoginForm
                onClose={() => setShowAuth(false)}
                onShowSignup={() => setAuthView('signup')}
                onShowReset={() => setAuthView('reset')}
              />
            )}
            {authView === 'signup' && (
              <SignupForm
                key={selectedRole}
                initialRole={selectedRole}
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
        </div>
      )}
    </div>
  );
}
