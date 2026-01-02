'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function LandingCTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-[4rem] bg-primary p-12 md:p-24 text-center relative overflow-hidden shadow-[0_48px_96px_-24px_rgba(var(--primary),0.5)]"
      >
        {/* Background mesh */}
        <div className="absolute inset-0 opacity-30 select-none pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#ffffff33_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,#00000033_0%,transparent_50%)]" />
        </div>

        <div className="relative z-10 space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>The Journey Awaits</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
            Begin Your <br />
            <span className="italic opacity-80">Greatest Chapter.</span>
          </h2>

          <p className="text-white/80 text-xl md:text-2xl font-medium max-w-2xl mx-auto">
            Stop merely reading. Start absorbing. Join the elite who use Trove to conquer their
            library.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-20 px-12 rounded-full text-2xl font-black italic bg-white text-primary hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                Claim User ID
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </div>

          <p className="text-white/40 text-sm font-bold uppercase tracking-[0.3em]">
            Ready to start? No friction. No limits.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
