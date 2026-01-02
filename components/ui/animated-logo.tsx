'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export function AnimatedLogo() {
  return (
    <motion.div
      className="flex items-center gap-2 group cursor-pointer"
      whileHover="hover"
      initial="initial"
    >
      <div className="relative">
        <motion.div
          animate={{ rotateY: [0, -20, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10"
        >
          <BookOpen className="h-8 w-8 text-primary fill-primary/10" />
        </motion.div>

        {/* Glow effect - pulses continuously */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"
        />
      </div>

      <motion.h1
        className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
        animate={{
          backgroundPosition: ['0% center', '200% center'],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        Trove
      </motion.h1>
    </motion.div>
  );
}
