'use client';

import {
    BookMarked,
    History,
    List,
    Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
    bookId: string;
    userId: string;
    bookTitle: string;
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
}: ReaderNavigationProps) {
    const [pageInput, setPageInput] = useState(currentPage?.toString() || '');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (currentPage) {
            setPageInput(currentPage.toString());
        }
    }, [currentPage]);

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
                <Button variant="ghost" size="icon" aria-label="Reader navigation">
                    <List className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0 flex flex-col">
                <div className="flex flex-col h-full">
                    <SheetHeader className="px-6 py-4 border-b">
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>

                    {/* Page Jump */}
                    {(totalPages || currentPage) && (
                        <form onSubmit={handlePageSubmit} className="px-4 py-3 border-b">
                            <label className="text-sm font-medium">Go to page</label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    type="number"
                                    placeholder={`1 - ${totalPages}`}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    min={1}
                                    max={totalPages}
                                />
                                <Button type="submit" size="sm">Go</Button>
                            </div>
                        </form>
                    )}

                    <Tabs defaultValue="history" className="h-full flex flex-col">
                        <div className="px-4 py-2 border-b">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="history" title="History"><History className="h-4 w-4" /></TabsTrigger>
                                <TabsTrigger value="bookmarks" title="Bookmarks"><BookMarked className="h-4 w-4" /></TabsTrigger>
                                <TabsTrigger value="quotes" title="Saved Quotes"><Sparkles className="h-4 w-4" /></TabsTrigger>
                                <TabsTrigger value="ai" className="text-purple-600" title="AI Assistant"><Sparkles className="h-4 w-4" /></TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <TabsContent value="history" className="m-0 p-4">
                                <div className="space-y-4">
                                    {history.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No reading history yet</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelection(item.data)}
                                                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(item.timestamp || new Date().toISOString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {item.subLabel && (
                                                    <p className="text-xs text-muted-foreground truncate">{item.subLabel}</p>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="bookmarks" className="m-0 p-4">
                                <div className="space-y-4">
                                    {bookmarks.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No bookmarks yet</p>
                                        </div>
                                    ) : (
                                        bookmarks.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelection(item.data)}
                                                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <p className="font-medium text-sm mb-1">{item.label}</p>
                                                <p className="text-xs text-muted-foreground truncate">{item.subLabel}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="quotes" className="m-0 p-4">
                                <div className="space-y-4">
                                    {quotes.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No quotes or highlights yet</p>
                                        </div>
                                    ) : (
                                        quotes.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelection(item.data.selection_data || item.data)}
                                                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-1.5 h-12 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: item.data.color || '#fef08a' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                                                            {item.label}
                                                        </p>
                                                        <p className="text-sm line-clamp-3 italic mb-2">
                                                            "{item.data.quote_text}"
                                                        </p>
                                                        {item.data.note && (
                                                            <p className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
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
