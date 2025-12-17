"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sparkles, BookOpen, Zap } from "lucide-react"

export function LandingHero() {
    return (
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8 shadow-inner"
            >
                <Sparkles className="w-3 h-3" />
                <span>The Intelligence for Readers is Here</span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-4xl space-y-8"
            >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-foreground">
                    Your Reading, <br />
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent italic">
                        Reinvented.
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                    Trove is your intelligent sanctuary for wisdom.
                    Organize your library, capture insights with AI, and join the elite Circle of readers.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                    <Link href="/signup">
                        <Button size="lg" className="h-16 px-12 rounded-full text-xl font-black italic shadow-[0_20px_40px_-12px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 transition-all bg-primary group">
                            Start Your Journey
                            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" size="lg" className="h-16 px-10 rounded-full text-lg font-bold border-2 hover:bg-primary/5">
                            See Features
                        </Button>
                    </Link>
                </div>

                {/* Social Proof / Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
                >
                    {[
                        { icon: BookOpen, label: "10k+ Books" },
                        { icon: Zap, label: "AI Powered" },
                        { icon: Sparkles, label: "Naira Payments" },
                        { icon: ArrowRight, label: "Live Hub" }
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]">
                            <stat.icon className="w-4 h-4" />
                            {stat.label}
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    )
}

