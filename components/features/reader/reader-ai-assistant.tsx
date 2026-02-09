'use client';

import { Sparkles, MessageSquare, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ReaderAiAssistantProps {
    bookTitle: string;
    currentPage?: number;
    currentCFI?: string;
    progressPercentage?: number;
    userId: string;
    bookId: string;
}

export function ReaderAiAssistant({
    bookTitle,
    currentPage,
    progressPercentage,
    userId,
    bookId
}: ReaderAiAssistantProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');

    const handleAction = async (action: 'summarize' | 'explain' | 'insights') => {
        setLoading(true);
        try {
            const context = `Reading "${bookTitle}" at ${currentPage ? `page ${currentPage}` : progressPercentage ? `${Math.round(progressPercentage)}%` : 'current position'}.`;

            const response = await fetch('/api/ai/reader-helper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    context,
                    bookId,
                    userId
                })
            });

            if (!response.ok) throw new Error('AI assistance failed');
            const data = await response.json();

            setMessages(prev => [...prev, {
                type: 'ai',
                text: data.result,
                actionLabel: action === 'summarize' ? 'Summary' : action === 'explain' ? 'Explanation' : 'Insights'
            }]);
        } catch (error) {
            console.error('AI Error:', error);
            toast.error('Failed to get AI assistance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Trove AI Assistant</span>
                </div>
                <p className="text-xs text-purple-900/70 dark:text-purple-300/70 leading-relaxed mb-3">
                    Your context-aware reading companion for "{bookTitle}".
                </p>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-bold border-purple-200 hover:bg-purple-100"
                        onClick={() => handleAction('summarize')}
                        disabled={loading}
                    >
                        <BookOpen className="h-3 w-3 mr-1" /> Summarize Page
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-bold border-purple-200 hover:bg-purple-100"
                        onClick={() => handleAction('insights')}
                        disabled={loading}
                    >
                        <Sparkles className="h-3 w-3 mr-1" /> Get Insights
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-1">
                <div className="space-y-4 pb-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-xs font-medium">Ask a question or use an action above</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-1.5 uppercase tracking-tighter text-[9px] font-bold text-muted-foreground">
                                    <Sparkles className="h-2.5 w-2.5 text-purple-500" />
                                    <span>{msg.actionLabel || 'AI Assistant'}</span>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50 border text-sm leading-relaxed italic">
                                    {msg.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="pt-2 border-t mt-auto">
                <div className="relative group">
                    <Input
                        placeholder="Ask about this book..."
                        className="h-10 pr-10 rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-purple-500"
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter' && input.trim()) {
                                toast.info("AI Chat integration coming soon!");
                                setInput('');
                            }
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 text-purple-600"
                        onClick={() => toast.info("AI Chat integration coming soon!")}
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
