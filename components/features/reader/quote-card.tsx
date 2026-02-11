'use client';

import { Share2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';

interface QuoteCardProps {
    quote: string;
    bookTitle: string;
    author?: string;
    isOpen: boolean;
    onClose: () => void;
}

const THEMES = [
    {
        name: 'Midnight',
        bg: 'bg-gradient-to-br from-gray-900 via-blue-900 to-black',
        text: 'text-white',
        accent: 'bg-blue-500/20',
    },
    {
        name: 'Sunset',
        bg: 'bg-gradient-to-br from-orange-500 via-red-600 to-purple-700',
        text: 'text-white',
        accent: 'bg-white/20',
    },
    {
        name: 'Forest',
        bg: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900',
        text: 'text-white',
        accent: 'bg-emerald-400/20',
    },
    {
        name: 'Minimal',
        bg: 'bg-white border border-gray-200',
        text: 'text-gray-900',
        accent: 'bg-gray-100',
    },
];

export function QuoteCard({ quote, bookTitle, author, isOpen, onClose }: QuoteCardProps) {
    const [activeTheme, setActiveTheme] = useState(THEMES[0]);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        try {
            // In a real production app, we would use html2canvas or similar to copy the actual styled element.
            // For now, we'll copy the text with a nice formatting.
            const textToCopy = `"${quote}"\n\n— ${bookTitle}${author ? ` by ${author}` : ''}\nShared from Trove`;
            await navigator.clipboard.writeText(textToCopy);
            toast.success('Quote text copied to clipboard!');
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-[var(--reader-bg-secondary)] border-[var(--reader-border)]">
                <div className="flex flex-col gap-6 p-6">
                    <Card
                        ref={cardRef}
                        className={`relative min-h-[400px] flex flex-col items-center justify-center p-10 text-center shadow-2xl transition-all duration-500 ${activeTheme.bg} ${activeTheme.text} border-none overflow-hidden`}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl opacity-30" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-3xl opacity-30" />
                        </div>

                        <div className="relative z-10 space-y-8">
                            <span className="text-6xl font-serif opacity-30 select-none">"</span>
                            <p className="text-xl md:text-2xl font-medium leading-relaxed italic px-4">
                                {quote}
                            </p>
                            <div className="space-y-3">
                                <div className={`h-px w-12 mx-auto ${activeTheme.text === 'text-white' ? 'bg-white/30' : 'bg-black/10'}`} />
                                <h3 className="text-lg font-bold leading-tight">{bookTitle}</h3>
                                {author && <p className="text-sm opacity-80">{author}</p>}
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-0 w-full text-center">
                            <p className="text-[10px] uppercase tracking-widest opacity-40">Shared via Trove</p>
                        </div>
                    </Card>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 border border-white/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Themes</span>
                            <div className="flex gap-2">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.name}
                                        onClick={() => setActiveTheme(theme)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${activeTheme.name === theme.name ? 'border-white scale-110' : 'border-transparent opacity-50'
                                            }`}
                                    >
                                        <div className={`w-full h-full rounded-full ${theme.bg}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={handleCopy} className="flex-1 bg-white text-black hover:bg-gray-100">
                                <Share2 className="mr-2 h-4 w-4" /> Copy Text
                            </Button>
                            <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
