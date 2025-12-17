import { BookOpen, Github, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"

export function LandingFooter() {
    return (
        <footer className="py-20 border-t border-border/50 bg-background relative overflow-hidden">
            <div className="container mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="text-2xl font-black tracking-tighter italic">Trove</span>
                        </Link>
                        <p className="text-muted-foreground text-lg max-w-sm font-medium">
                            The intelligent sanctuary for the modern polymath.
                            Master your library, capture every spark of wisdom.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Navigation</h4>
                        <ul className="space-y-4 font-bold">
                            <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                            <li><Link href="/signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Legal</h4>
                        <ul className="space-y-4 font-bold">
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Lore</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms of Entry</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm font-bold opacity-30 uppercase tracking-widest">
                        © {new Date().getFullYear()} Trove Research. Built for the elite.
                    </p>

                    <div className="flex gap-6">
                        <Github className="w-5 h-5 opacity-40 hover:opacity-100 hover:text-primary transition-all cursor-pointer" />
                        <Twitter className="w-5 h-5 opacity-40 hover:opacity-100 hover:text-primary transition-all cursor-pointer" />
                        <Linkedin className="w-5 h-5 opacity-40 hover:opacity-100 hover:text-primary transition-all cursor-pointer" />
                    </div>
                </div>
            </div>
        </footer>
    )
}

