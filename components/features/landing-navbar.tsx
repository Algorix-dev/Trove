'use client';

import { motion } from 'framer-motion';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function LandingNavbar() {
  const { user, loading } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-8 py-5 bg-background/40 backdrop-blur-2xl sticky top-4 mx-4 md:mx-12 rounded-[2rem] z-50 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all"
      role="navigation"
      aria-label="Main navigation"
    >
      <Link href="/" className="flex items-center gap-3 group">
        <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
          <BookOpen className="h-6 w-6 text-primary group-hover:text-white" aria-hidden="true" />
        </div>
        <span className="text-2xl font-black tracking-tighter italic">Trove</span>
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {loading ? (
          <Button variant="ghost" disabled className="rounded-full">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </Button>
        ) : user ? (
          <Link href="/dashboard" aria-label="Go to dashboard">
            <Button className="rounded-full px-8 font-black italic shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Dashboard
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" aria-label="Sign in to your account" className="hidden sm:block">
              <Button variant="ghost" className="rounded-full font-bold hover:bg-primary/5">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" aria-label="Create a new account">
              <Button className="rounded-full px-8 font-black italic bg-primary shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
