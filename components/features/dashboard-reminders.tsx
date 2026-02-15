'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Bookmark, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cleanBookTitle } from '@/lib/utils';

interface LatestItem {
    type: 'bookmark' | 'highlight';
    id: string;
    book_id: string;
    title: string;
    content: string;
    location: string;
    timestamp: string;
    url: string;
}

export function DashboardReminders() {
    const [latestBookmark, setLatestBookmark] = useState<LatestItem | null>(null);
    const [latestHighlight, setLatestHighlight] = useState<LatestItem | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    useEffect(() => {
        async function fetchLatest() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch latest bookmark
            const { data: bookmarkData } = await supabase
                .from('bookmarks')
                .select(`
          id, book_id, page_number, epub_cfi, progress_percentage, created_at, note,
          books (title)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (bookmarkData) {
                const book = Array.isArray(bookmarkData.books) ? bookmarkData.books[0] : bookmarkData.books;
                const location = bookmarkData.page_number ? `Page ${bookmarkData.page_number}` :
                    bookmarkData.progress_percentage ? `${bookmarkData.progress_percentage}%` : 'Recent Position';

                const params = new URLSearchParams();
                if (bookmarkData.page_number) params.set('page', bookmarkData.page_number.toString());
                else if (bookmarkData.epub_cfi) params.set('cfi', bookmarkData.epub_cfi);

                setLatestBookmark({
                    type: 'bookmark',
                    id: bookmarkData.id,
                    book_id: bookmarkData.book_id,
                    title: book?.title || 'Unknown Book',
                    content: bookmarkData.note || 'You saved this location',
                    location,
                    timestamp: bookmarkData.created_at,
                    url: `/dashboard/reader/${bookmarkData.book_id}${params.toString() ? `?${params.toString()}` : ''}`
                });
            }

            // Fetch latest highlight
            const { data: highlightData } = await supabase
                .from('book_quotes')
                .select(`
          id, book_id, quote_text, page_number, created_at,
          books (title)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (highlightData) {
                const book = Array.isArray(highlightData.books) ? highlightData.books[0] : highlightData.books;
                setLatestHighlight({
                    type: 'highlight',
                    id: highlightData.id,
                    book_id: highlightData.book_id,
                    title: book?.title || 'Unknown Book',
                    content: highlightData.quote_text || 'No text captured',
                    location: highlightData.page_number ? `Page ${highlightData.page_number}` : 'Highlight',
                    timestamp: highlightData.created_at,
                    url: `/dashboard/reader/${highlightData.book_id}${highlightData.page_number ? `?page=${highlightData.page_number}` : ''}`
                });
            }

            setLoading(false);
        }

        fetchLatest();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-48 bg-muted rounded-full animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-muted rounded-[2rem] animate-pulse" />
                    <div className="h-32 bg-muted rounded-[2rem] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!latestBookmark && !latestHighlight) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    Pick up where you left off
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {latestBookmark && (
                    <Link href={latestBookmark.url} className="group h-full">
                        <Card className="h-full border-none shadow-xl bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:bg-card/60 transition-all duration-500 group-hover:-translate-y-1">
                            <CardContent className="p-7">
                                <div className="flex gap-5 items-start">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <Bookmark className="h-5 w-5 text-primary fill-primary/20" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Last Bookmark</span>
                                            <span className="text-[10px] text-muted-foreground">• {latestBookmark.location}</span>
                                        </div>
                                        <h4 className="font-extrabold text-base truncate mb-2">{cleanBookTitle(latestBookmark.title)}</h4>
                                        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed italic">
                                            "{latestBookmark.content}"
                                        </p>
                                    </div>
                                    <div className="self-center">
                                        <ArrowRight className="h-5 w-5 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {latestHighlight && (
                    <Link href={latestHighlight.url} className="group h-full">
                        <Card className="h-full border-none shadow-xl bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:bg-card/60 transition-all duration-500 group-hover:-translate-y-1">
                            <CardContent className="p-7">
                                <div className="flex gap-5 items-start">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                        <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/10" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Last Insight</span>
                                            <span className="text-[10px] text-muted-foreground">• {latestHighlight.location}</span>
                                        </div>
                                        <h4 className="font-extrabold text-base truncate mb-2">{cleanBookTitle(latestHighlight.title)}</h4>
                                        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed font-serif">
                                            "{latestHighlight.content}"
                                        </p>
                                    </div>
                                    <div className="self-center">
                                        <ArrowRight className="h-5 w-5 text-amber-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>
        </div>
    );
}
