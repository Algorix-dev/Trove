import { createBrowserClient } from '@supabase/ssr';
import {
    BookMarked,
    History,
    List,
    Sparkles,
    Clock,
    BookOpen,
    Trash2,
    Calendar,
    Brain,
    Bookmark,
    Highlighter,
    MessageSquare
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { ReaderAiAssistant } from './reader-ai-assistant';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NavItem {
    id: string | number;
    label: string;
    subLabel?: string;
    data: any;
    timestamp?: string;
}

interface ReaderNavigationProps {
    totalPages?: number;
    currentPage?: number;
    currentCFI?: string;
    bookmarks: NavItem[];
    history: NavItem[];
    quotes: NavItem[];
    onNavigate: (data: any) => void;
    onDeleteBookmark?: (id: string) => void;
    bookId: string;
    userId: string;
    bookTitle: string;
}

interface ActivityBurst {
    date: string;
    totalMinutes: number;
    pageRange: { start: number; end: number };
    id: string;
}

export function ReaderNavigation({
    totalPages,
    currentPage,
    bookmarks,
    history,
    quotes,
    onNavigate,
    userId,
    bookId,
    bookTitle,
    currentCFI,
    onDeleteBookmark,
}: ReaderNavigationProps) {
    const [pageInput, setPageInput] = useState(currentPage?.toString() || '');
    const [isOpen, setIsOpen] = useState(false);
    const [activity, setActivity] = useState<ActivityBurst[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);

    const supabase = useMemo(() => createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    ), []);

    useEffect(() => {
        if (currentPage) {
            setPageInput(currentPage.toString());
        }
    }, [currentPage]);

    const fetchActivity = async () => {
        setIsLoadingActivity(true);
        try {
            const { data, error } = await supabase
                .from('reading_sessions')
                .select('*')
                .eq('book_id', bookId)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Aggregate into Daily Bursts
                const groups: Record<string, ActivityBurst> = {};

                data.forEach((s: any) => {
                    const date = new Date(s.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    });

                    if (!groups[date]) {
                        groups[date] = {
                            id: date,
                            date,
                            totalMinutes: 0,
                            pageRange: { start: s.start_page || 0, end: s.end_page || 0 }
                        };
                    }

                    groups[date].totalMinutes += (s.duration_minutes || 1);
                    // For accuracy, we show the highest page reached in this session
                    if (s.end_page) groups[date].pageRange.end = Math.max(groups[date].pageRange.end, s.end_page);
                    if (s.start_page && !groups[date].pageRange.start) groups[date].pageRange.start = s.start_page;
                });

                setActivity(Object.values(groups).sort((a, b) => {
                    return new Date(b.id).getTime() - new Date(a.id).getTime();
                }));
            }
        } catch (err) {
            console.error('Failed to fetch activity:', err);
        } finally {
            setIsLoadingActivity(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchActivity();
        }
    }, [isOpen]);

    const handlePageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(pageInput);
        if (page > 0) {
            if (totalPages && page > totalPages) return;
            onNavigate({ page });
            setIsOpen(false);
        }
    };

    const handleSelection = (data: any) => {
        onNavigate(data);
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Reader navigation" className="hover:bg-[var(--reader-accent)]/10">
                    <List className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0 flex flex-col bg-[var(--reader-bg)] border-[var(--reader-border)] h-screen">
                <div className="flex flex-col h-full overflow-hidden">
                    <SheetHeader className="px-6 py-6 border-b border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/10">
                        <SheetTitle className="text-[var(--reader-text)] text-xl font-extrabold tracking-tight flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[var(--reader-accent)]" />
                            Library Engine
                        </SheetTitle>
                    </SheetHeader>

                    {/* Page Jump */}
                    {(totalPages || currentPage) && (
                        <form onSubmit={handlePageSubmit} className="px-6 py-5 border-b border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/20 backdrop-blur-md">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--reader-text-muted)] mb-3 block">Jump to page</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder={`1 - ${totalPages}`}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    min={1}
                                    max={totalPages}
                                    className="bg-[var(--reader-bg)]/50 border-[var(--reader-border)] text-[var(--reader-text)] h-10 rounded-xl focus:ring-1 focus:ring-[var(--reader-accent)] transition-all"
                                />
                                <Button type="submit" size="sm" className="bg-[var(--reader-accent)] hover:opacity-90 h-10 px-4 rounded-xl shadow-lg shadow-[var(--reader-accent)]/20 transition-all active:scale-95">Go</Button>
                            </div>
                        </form>
                    )}

                    <Tabs defaultValue="activity" className="flex-1 flex flex-col pt-2 min-h-0">
                        <div className="px-6 mb-4">
                            <TabsList className="grid w-full grid-cols-4 bg-[var(--reader-bg-secondary)]/50 p-1 rounded-2xl border border-[var(--reader-border)] h-12">
                                <TabsTrigger value="activity" title="Reading Timeline" className="rounded-xl data-[state=active]:bg-[var(--reader-bg)] data-[state=active]:shadow-sm text-[var(--reader-text-muted)] data-[state=active]:text-[var(--reader-text)] transition-all">
                                    <Clock className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="bookmarks" title="Quick Bookmarks" className="rounded-xl data-[state=active]:bg-[var(--reader-bg)] data-[state=active]:shadow-sm text-[var(--reader-text-muted)] data-[state=active]:text-[var(--reader-text)] transition-all">
                                    <BookMarked className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="quotes" title="Saved Insights" className="rounded-xl data-[state=active]:bg-[var(--reader-bg)] data-[state=active]:shadow-sm text-[var(--reader-text-muted)] data-[state=active]:text-[var(--reader-text)] transition-all">
                                    <Sparkles className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="ai" className="rounded-xl text-purple-600 data-[state=active]:bg-[var(--reader-bg)] data-[state=active]:shadow-sm transition-all" title="AI Analyst">
                                    <Brain className="h-4 w-4" />
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 min-h-0 overflow-x-hidden">
                            <TabsContent value="activity" className="m-0 p-4 min-h-0">
                                <div className="space-y-3">
                                    {isLoadingActivity ? (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-full border-2 border-[var(--reader-accent)]/20 animate-ping absolute inset-0"></div>
                                                <div className="h-12 w-12 rounded-full border-2 border-t-[var(--reader-accent)] border-[var(--reader-accent)]/10 animate-spin"></div>
                                            </div>
                                            <p className="text-[10px] font-bold text-[var(--reader-text-muted)] uppercase tracking-widest">Chronicaling history...</p>
                                        </div>
                                    ) : activity.length === 0 ? (
                                        <div className="text-center py-12 text-[var(--reader-text-muted)]">
                                            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[var(--reader-bg-secondary)] flex items-center justify-center border border-[var(--reader-border)]">
                                                <History className="h-8 w-8 opacity-20" />
                                            </div>
                                            <p className="text-sm font-medium">No activity recorded yet</p>
                                        </div>
                                    ) : (
                                        activity.map((burst) => (
                                            <div
                                                key={burst.id}
                                                className="w-full text-left p-5 rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/40 backdrop-blur-sm space-y-3 transition-all hover:bg-[var(--reader-bg-secondary)]/60 group/item shadow-sm"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-[var(--reader-text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="h-3 w-3" />
                                                        {burst.date}
                                                    </span>
                                                    <div className="px-2 py-0.5 rounded-full bg-[var(--reader-accent)]/10 text-[var(--reader-accent)] flex items-center gap-1.5 border border-[var(--reader-accent)]/20">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold">{burst.totalMinutes}m Read</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-[var(--reader-accent)]/5 flex items-center justify-center border border-[var(--reader-accent)]/10 group-hover/item:scale-105 transition-transform">
                                                        <BookOpen className="h-6 w-6 text-[var(--reader-accent)]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[var(--reader-text)] leading-tight">
                                                            Reached Page {burst.pageRange.end}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--reader-text-muted)] mt-1 font-medium tracking-wide">
                                                            PROGRESS UPDATE • {burst.pageRange.start === burst.pageRange.end ? 'Started here' : `Started at page ${burst.pageRange.start}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Legacy History (Points in time) */}
                                    {history.length > 0 && (
                                        <div className="pt-6 mt-6 border-t border-[var(--reader-border)]">
                                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--reader-text-muted)] mb-4 px-1">Deep History</h3>
                                            <div className="space-y-1">
                                                {history.slice(0, 5).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelection(item.data)}
                                                        className="w-full flex items-center justify-between p-3 text-[11px] rounded-xl hover:bg-[var(--reader-accent)]/10 text-[var(--reader-text-muted)] group/history transition-all active:scale-[0.98]"
                                                    >
                                                        <span className="group-hover/history:text-[var(--reader-text)] font-medium">{item.label}</span>
                                                        <span className="opacity-40 text-[9px] group-hover/history:opacity-100 transition-opacity uppercase font-bold">{new Date(item.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="bookmarks" className="m-0 p-4">
                                <div className="space-y-4">
                                    {bookmarks.length === 0 ? (
                                        <div className="text-center py-12 text-[var(--reader-text-muted)]">
                                            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[var(--reader-bg-secondary)] flex items-center justify-center border border-[var(--reader-border)]">
                                                <Bookmark className="h-8 w-8 opacity-20" />
                                            </div>
                                            <p className="text-sm font-medium">Capture important moments</p>
                                        </div>
                                    ) : (
                                        bookmarks.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group relative flex items-center w-full"
                                            >
                                                <button
                                                    onClick={() => handleSelection(item.data)}
                                                    className="flex-1 text-left p-4 rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/40 hover:bg-[var(--reader-accent)]/5 transition-all pr-12 shadow-sm"
                                                >
                                                    <p className="font-bold text-sm mb-1 text-[var(--reader-text)] tracking-tight">{item.label}</p>
                                                    <p className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-wide font-medium">{item.subLabel}</p>
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 text-[var(--reader-text-muted)] hover:text-white hover:bg-destructive h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteBookmark?.(item.id.toString());
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="quotes" className="m-0 p-4">
                                <div className="space-y-4">
                                    {quotes.length === 0 ? (
                                        <div className="text-center py-12 text-[var(--reader-text-muted)]">
                                            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[var(--reader-bg-secondary)] flex items-center justify-center border border-[var(--reader-border)]">
                                                <Sparkles className="h-8 w-8 opacity-20" />
                                            </div>
                                            <p className="text-sm font-medium">Save insights from your books</p>
                                        </div>
                                    ) : (
                                        quotes.map((item) => (
                                            <div
                                                key={item.id}
                                                className="w-full text-left p-4 rounded-2xl border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/40 backdrop-blur-sm space-y-3 hover:bg-[var(--reader-bg-secondary)]/60 transition-all shadow-sm"
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.data.color || 'var(--reader-accent)' }}></div>
                                                            <span className="text-[10px] font-bold text-[var(--reader-text-muted)] uppercase tracking-widest">{item.label}</span>
                                                        </div>
                                                        <p className="text-sm text-[var(--reader-text)] leading-relaxed italic font-serif">
                                                            "{item.data.quote_text}"
                                                        </p>
                                                        {item.data.note && (
                                                            <div className="mt-3 p-3 rounded-xl bg-[var(--reader-bg)]/80 border border-[var(--reader-border)] text-[var(--reader-text-muted)] text-[13px] leading-relaxed">
                                                                <span className="font-bold text-[10px] uppercase text-[var(--reader-accent)] block mb-1">My Reflection</span>
                                                                {item.data.note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleSelection(item.data)}
                                                    className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--reader-accent)] hover:bg-[var(--reader-accent)]/10 rounded-lg transition-colors border border-[var(--reader-accent)]/10"
                                                >
                                                    Return to insight
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="ai" className="m-0 p-4 min-h-0">
                                <div className="space-y-5">
                                    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 backdrop-blur-xl">
                                        <div className="h-12 w-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                                            <Brain className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-[var(--reader-text)] mb-2">Omni Intelligence</h3>
                                        <p className="text-sm text-[var(--reader-text-muted)] leading-relaxed mb-4">
                                            Highlight any text to analyze concepts, explain complex ideas, or generate deep insights.
                                        </p>
                                        <Button variant="outline" className="w-full rounded-2xl border-purple-500/30 text-purple-600 hover:bg-purple-50 h-11 font-bold text-xs uppercase tracking-widest">
                                            Launch AI Workspace
                                        </Button>
                                    </div>
                                    <div className="pt-2">
                                        <ReaderAiAssistant
                                            bookTitle={bookTitle}
                                            currentPage={currentPage}
                                            currentCFI={currentCFI}
                                            progressPercentage={history[0]?.data?.progressPercentage}
                                            userId={userId}
                                            bookId={bookId}
                                        />
                                    </div>

                                    <div className="space-y-3 pb-4">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--reader-text-muted)] px-1">Active Capabilities</h4>
                                        {[
                                            { icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Contextual Explanation', desc: 'Understand difficult terminologies' },
                                            { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Interactive Dialogue', desc: 'Ask about characters or plot' },
                                            { icon: Highlighter, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Auto Summarization', desc: 'Quick overview of long chapters' }
                                        ].map((tool, i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-[var(--reader-bg-secondary)]/30 border border-[var(--reader-border)] group hover:border-[var(--reader-accent)]/20 transition-all cursor-default">
                                                <div className={`h-10 w-10 rounded-xl ${tool.bg} flex items-center justify-center shrink-0`}>
                                                    <tool.icon className={`h-5 w-5 ${tool.color}`} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[var(--reader-text)]">{tool.title}</p>
                                                    <p className="text-[10px] text-[var(--reader-text-muted)] mt-0.5">{tool.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
