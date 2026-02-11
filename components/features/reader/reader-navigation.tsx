import { createBrowserClient } from '@supabase/ssr';
import {
    BookMarked,
    History,
    List,
    Sparkles,
    Clock,
    BookOpen,
    Trash2
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
                    if (s.start_page) groups[date].pageRange.start = Math.max(1, Math.min(groups[date].pageRange.start, s.start_page));
                    if (s.end_page) groups[date].pageRange.end = Math.max(groups[date].pageRange.end, s.end_page);
                });

                setActivity(Object.values(groups));
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
            <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0 flex flex-col bg-[var(--reader-bg)] border-[var(--reader-border)]">
                <div className="flex flex-col h-full">
                    <SheetHeader className="px-6 py-4 border-b border-[var(--reader-border)]">
                        <SheetTitle className="text-[var(--reader-text)]">Reader Engine</SheetTitle>
                    </SheetHeader>

                    {/* Page Jump */}
                    {(totalPages || currentPage) && (
                        <form onSubmit={handlePageSubmit} className="px-4 py-3 border-b border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/30">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--reader-text-muted)]">Jump to page</label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    type="number"
                                    placeholder={`1 - ${totalPages}`}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    min={1}
                                    max={totalPages}
                                    className="bg-[var(--reader-bg)] border-[var(--reader-border)] text-[var(--reader-text)]"
                                />
                                <Button type="submit" size="sm" className="bg-[var(--reader-accent)] hover:opacity-90">Go</Button>
                            </div>
                        </form>
                    )}

                    <Tabs defaultValue="activity" className="h-full flex flex-col">
                        <div className="px-4 py-2 border-b border-[var(--reader-border)]">
                            <TabsList className="grid w-full grid-cols-4 bg-[var(--reader-bg-secondary)]">
                                <TabsTrigger value="activity" title="Smart History" className="data-[state=active]:bg-[var(--reader-bg)] text-[var(--reader-text-muted)] data-[state=active]:text-[var(--reader-text)]">
                                    <Clock className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="bookmarks" title="Bookmarks" className="data-[state=active]:bg-[var(--reader-bg)] text-[var(--reader-text-muted)] data-[state=active]:text-[var(--reader-text)]">
                                    <BookMarked className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="quotes" title="Saved Quotes" className="data-[state=active]:bg-[var(--reader-bg)] text-[var(--reader-text-muted)] data-[state=active]:text-[var(--reader-text)]">
                                    <Sparkles className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="ai" className="text-purple-600 data-[state=active]:bg-[var(--reader-bg)]" title="AI Assistant">
                                    <Sparkles className="h-4 w-4" />
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <TabsContent value="activity" className="m-0 p-4">
                                <div className="space-y-3">
                                    {isLoadingActivity ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--reader-accent)]"></div>
                                        </div>
                                    ) : activity.length === 0 ? (
                                        <div className="text-center py-8 text-[var(--reader-text-muted)]">
                                            <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No activity recorded yet</p>
                                        </div>
                                    ) : (
                                        activity.map((burst) => (
                                            <div
                                                key={burst.id}
                                                className="w-full text-left p-4 rounded-xl border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/50 space-y-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-[var(--reader-text-muted)] uppercase tracking-tight">
                                                        {burst.date}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[var(--reader-accent)]">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-xs font-bold">{burst.totalMinutes}m</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-[var(--reader-accent)]/10 flex items-center justify-center">
                                                        <BookOpen className="h-5 w-5 text-[var(--reader-accent)]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--reader-text)] leading-none italic">
                                                            {burst.pageRange.start === burst.pageRange.end
                                                                ? `Page ${burst.pageRange.start}`
                                                                : `Pages ${burst.pageRange.start} → ${burst.pageRange.end}`
                                                            }
                                                        </p>
                                                        <p className="text-[10px] text-[var(--reader-text-muted)] mt-1">
                                                            Progress growth session
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Legacy History (Points in time) */}
                                    {history.length > 0 && (
                                        <div className="pt-4 mt-4 border-t border-[var(--reader-border)]">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--reader-text-muted)] mb-3">Recent Points</h3>
                                            <div className="space-y-2">
                                                {history.slice(0, 5).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelection(item.data)}
                                                        className="w-full flex items-center justify-between p-2 text-xs rounded-lg hover:bg-[var(--reader-accent)]/5 text-[var(--reader-text-muted)] transition-colors"
                                                    >
                                                        <span>{item.label}</span>
                                                        <span className="opacity-60">{new Date(item.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                        <div className="text-center py-8 text-[var(--reader-text-muted)]">
                                            <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No bookmarks yet</p>
                                        </div>
                                    ) : (
                                        bookmarks.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group relative flex items-center w-full"
                                            >
                                                <button
                                                    onClick={() => handleSelection(item.data)}
                                                    className="flex-1 text-left p-3 rounded-lg border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/50 hover:bg-[var(--reader-accent)]/5 transition-colors pr-10"
                                                >
                                                    <p className="font-medium text-sm mb-1 text-[var(--reader-text)]">{item.label}</p>
                                                    <p className="text-xs text-[var(--reader-text-muted)] truncate">{item.subLabel}</p>
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 text-[var(--reader-text-muted)] hover:text-destructive hover:bg-destructive/10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        <div className="text-center py-8 text-[var(--reader-text-muted)]">
                                            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No quotes or highlights yet</p>
                                        </div>
                                    ) : (
                                        quotes.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelection(item.data.selection_data || item.data)}
                                                className="w-full text-left p-3 rounded-lg border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/50 hover:bg-[var(--reader-accent)]/5 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-1.5 h-12 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: item.data.color || '#fef08a' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-[var(--reader-text-muted)] uppercase mb-1">
                                                            {item.label}
                                                        </p>
                                                        <p className="text-sm line-clamp-3 italic mb-2 text-[var(--reader-text)]">
                                                            "{item.data.quote_text}"
                                                        </p>
                                                        {item.data.note && (
                                                            <p className="text-xs text-[var(--reader-text-muted)] bg-[var(--reader-bg)] p-2 rounded border border-[var(--reader-border)]">
                                                                {item.data.note}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="ai" className="m-0 p-4 h-full">
                                <ReaderAiAssistant
                                    bookTitle={bookTitle}
                                    currentPage={currentPage}
                                    currentCFI={currentCFI}
                                    progressPercentage={history[0]?.data?.progressPercentage}
                                    userId={userId}
                                    bookId={bookId}
                                />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
