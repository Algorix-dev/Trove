'use client';

import {
    BookMarked,
    ChevronRight,
    History,
    List,
    Search
} from 'lucide-react';
import { useState } from 'react';

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
}

interface ReaderNavigationProps {
    totalPages?: number;
    currentPage?: number;
    currentCFI?: string;
    bookmarks: NavItem[];
    history: NavItem[];
    toc: NavItem[];
    onNavigate: (data: any) => void;
}

export function ReaderNavigation({
    totalPages,
    currentPage,
    bookmarks,
    history,
    toc,
    onNavigate,
}: ReaderNavigationProps) {
    const [pageInput, setPageInput] = useState(currentPage?.toString() || '');

    const handlePageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(pageInput);
        if (page > 0 && totalPages && page <= totalPages) {
            onNavigate({ page });
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="Navigation">
                    <List className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[350px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Page Jump */}
                    <form onSubmit={handlePageSubmit} className="space-y-2">
                        <label className="text-sm font-medium">Go to page</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder={`1 - ${totalPages || '?'}`}
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                min={1}
                                max={totalPages}
                            />
                            <Button type="submit" size="sm">Go</Button>
                        </div>
                    </form>

                    <Tabs defaultValue="toc" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="toc"><List className="h-4 w-4 mr-2" />ToC</TabsTrigger>
                            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />History</TabsTrigger>
                            <TabsTrigger value="bookmarks"><BookMarked className="h-4 w-4 mr-2" />Books</TabsTrigger>
                        </TabsList>

                        <TabsContent value="toc" className="mt-4">
                            <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                                {toc.length > 0 ? (
                                    <div className="space-y-1">
                                        {toc.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => onNavigate(item.data)}
                                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between group"
                                            >
                                                <span className="truncate">{item.label}</span>
                                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No Table of Contents found
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                                {history.length > 0 ? (
                                    <div className="space-y-1">
                                        {history.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => onNavigate(item.data)}
                                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                                            >
                                                <div className="font-medium">{item.label}</div>
                                                {item.subLabel && <div className="text-xs text-muted-foreground">{item.subLabel}</div>}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No recent history
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="bookmarks" className="mt-4">
                            <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                                {bookmarks.length > 0 ? (
                                    <div className="space-y-1">
                                        {bookmarks.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => onNavigate(item.data)}
                                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                                            >
                                                <div className="font-medium">{item.label}</div>
                                                {item.subLabel && <div className="text-xs text-muted-foreground">{item.subLabel}</div>}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No bookmarks saved
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
