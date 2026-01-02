import { LandingCTA } from '@/components/features/landing-cta';
import { LandingFeatures } from '@/components/features/landing-features';
import { LandingFooter } from '@/components/features/landing-footer';
import { LandingHero } from '@/components/features/landing-hero';
import { LandingNavbar } from '@/components/features/landing-navbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
