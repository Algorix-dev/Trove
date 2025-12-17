"use client"

import { motion } from "framer-motion"
import { Upload, BarChart3, Highlighter, Users, Zap, Shield, Sparkles } from "lucide-react"

const features = [
    {
        icon: Upload,
        title: "Omni-Library",
        description: "Bring your entire intellectual archive. PDF, EPUB, or TXT—we ingest it all.",
        gradient: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-500"
    },
    {
        icon: Zap,
        title: "AI Wisdom Extraction",
        description: "Condense thousands of pages into core insights using our proprietary AI layer.",
        gradient: "from-purple-500/20 to-pink-500/20",
        iconColor: "text-purple-500"
    },
    {
        icon: Highlighter,
        title: "Neural Highlighting",
        description: "Mark what matters. Your highlights are stored in a persistent knowledge graph.",
        gradient: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-500"
    },
    {
        icon: BarChart3,
        title: "Growth Metrics",
        description: "Visualize your intellectual evolution with high-fidelity habit tracking.",
        gradient: "from-green-500/20 to-emerald-500/20",
        iconColor: "text-green-500"
    },
    {
        icon: Users,
        title: "The Circle",
        description: "Connect with the technical elite. Join private clubs and discuss the lore.",
        gradient: "from-rose-500/20 to-red-500/20",
        iconColor: "text-rose-500"
    },
    {
        icon: Shield,
        title: "Sovereign Vault",
        description: "Your reading data is yours. Secure, encrypted, and perpetually accessible.",
        gradient: "from-indigo-500/20 to-purple-500/20",
        iconColor: "text-indigo-500"
    },
]

export function LandingFeatures() {
    return (
        <section id="features" className="py-32 bg-background relative overflow-hidden">
            <div className="container mx-auto px-8">
                <div className="text-center mb-24 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold uppercase tracking-[0.3em] text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>Core Capabilities</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter">Everything to <span className="italic opacity-50 underline decoration-primary/30">Ascend.</span></h2>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium">
                        Trove provides the high-performance tools required for modern polymaths and seekers.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            className="group relative p-10 rounded-[3rem] bg-muted/30 border border-border/50 hover:bg-card hover:border-primary/30 hover:shadow-[0_32px_64px_-16px_rgba(var(--primary),0.1)] transition-all duration-500 overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 space-y-6">
                                <div className={`w-16 h-16 rounded-[1.5rem] bg-background shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black tracking-tight">{feature.title}</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed font-medium">{feature.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

