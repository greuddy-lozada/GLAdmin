'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useUiStore } from '@/stores/ui-store';
import { LandingNav } from './landing-nav';
import { HeroSplit } from './hero-split';
import { BenefitsSection } from './benefits-section';
import { HowItWorksSection } from './how-it-works-section';
import { PricingSection } from './pricing-section';
import { TestimonialsSection } from './testimonials-section';
import { FaqSection } from './faq-section';
import { FinalCtaSection } from './final-cta-section';
import { LandingFooter } from './landing-footer';

export default function LandingPage() {
  const { isAuthenticated, isLoading, user, organizations } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const slug = user?.role?.slug ?? '';
    const isSystemRole = slug === 'master' || slug === 'admin';
    if (isSystemRole && organizations.length === 0) {
      router.replace('/dashboard');
      return;
    }
    const savedOrgId = localStorage.getItem('currentOrgId');
    const lastPath = useUiStore.getState().lastVisitedPath;
    useUiStore.getState().clearLastVisitedPath();
    const target = savedOrgId && lastPath ? lastPath : savedOrgId ? '/dashboard' : '/org-picker';
    router.replace(target);
  }, [isLoading, isAuthenticated, router, user, organizations]);

  if (isLoading || isAuthenticated) {
    return <div className="min-h-screen" aria-busy="true" />;
  }

  return (
    <>
      <LandingNav />
      <main>
        <HeroSplit />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
