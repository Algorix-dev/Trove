'use client';

import {
    Highlighter,
    MessageSquare,
    Quote,
    Share2,
    Sparkles,
    Trash2,
    X
} from 'lucide-react';
import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { QuoteCard } from './quote-card';

const COLORS = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Purple', value: '#ddd6fe' },
];

interface HighlightMenuProps {
    selectedText: string;
    bookId: string;
    bookTitle: string;
    author?: string;
    pageNumber?: number;
    chapter?: string;
    existingHighlight?: any;
    surroundingContext?: string;
    onSave: (data: any) => Promise<void>;
    onUpdate?: (id: string, data: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}

export function HighlightMenu({
    selectedText,
    onSave,
    onUpdate,
    onDelete,
    onClose,
    pageNumber,
    bookId,
    bookTitle,
    author,
    chapter,
    existingHighlight,
    surroundingContext,
}: HighlightMenuProps) {
    const [note, setNote] = useState(existingHighlight?.note || '');
    const [selectedColor, setSelectedColor] = useState(existingHighlight?.color || COLORS[0].value);
    const [showNoteInput, setShowNoteInput] = useState(!!existingHighlight?.note);
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [explaining, setExplaining] = useState(false);
    const [showQuoteCard, setShowQuoteCard] = useState(false);
    const [view, setView] = useState<'prompt' | 'full'>(existingHighlight ? 'full' : 'prompt');

    const handleSave = async (type: 'highlight' | 'quote') => {
        setLoading(true);
        try {
            if (existingHighlight && onUpdate) {
                await onUpdate(existingHighlight.id, {
                    note: note || null,
                    color: selectedColor,
                    highlight_type: type,
                });
            } else {
                await onSave({
                    quote_text: selectedText,
                    note: note || null,
                    color: selectedColor,
                    highlight_type: type,
                    page_number: pageNumber,
                    chapter: chapter,
                });
                toast.success(type === 'quote' ? 'Quote saved!' : 'Highlight saved!');
            }
            onClose();
        } catch (error) {
            console.error('Failed to save highlight:', error);
            toast.error('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingHighlight || !onDelete) return;
        setLoading(true);
        try {
            await onDelete(existingHighlight.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete highlight:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async () => {
        setExplaining(true);
        try {
            const response = await fetch('/api/ai/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedText,
                    context: surroundingContext || '',
                    bookId,
                }),
            });

            if (!response.ok) throw new Error('Failed to get explanation');
            const data = await response.json();
            setExplanation(data.explanation);
            if (view === 'prompt') setView('full');
        } catch (error) {
            console.error('AI Explanation failed:', error);
            toast.error('Failed to get AI explanation');
        } finally {
            setExplaining(false);
        }
    };

    if (view === 'prompt') {
        return (
            <div className="flex flex-col gap-3 bg-background border shadow-xl rounded-xl p-3 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Save as quote?
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted" onClick={onClose}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1 h-8 rounded-lg font-bold"
                        onClick={() => handleSave('quote')}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Yes'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 rounded-lg font-bold"
                        onClick={() => setView('full')}
                        disabled={loading}
                    >
                        Options
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 bg-background border shadow-xl rounded-xl p-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {existingHighlight ? 'Edit Highlight' : 'Selection Options'}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <div className="flex items-center gap-1.5 px-1">
                {COLORS.map((color) => (
                    <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color.value ? 'border-primary' : 'border-transparent'
                            }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                    />
                ))}
            </div>

            <div className="h-px bg-border my-1" />

            <div className="flex flex-col gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => handleSave('highlight')}
                    disabled={loading}
                >
                    <Highlighter className="h-4 w-4" />
                    <span>{existingHighlight ? 'Update Color' : 'Highlight Only'}</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    disabled={loading}
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>{showNoteInput ? 'Collapse Note' : 'Add/Edit Note'}</span>
                </Button>

                {!existingHighlight && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2 h-9"
                            onClick={() => handleSave('quote')}
                            disabled={loading}
                        >
                            <Quote className="h-4 w-4" />
                            <span>Save as Quote</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2 h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setShowQuoteCard(true)}
                            disabled={loading}
                        >
                            <Share2 className="h-4 w-4" />
                            <span>Create Quote Card</span>
                        </Button>
                    </>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={handleExplain}
                    disabled={explaining}
                >
                    <Sparkles className="h-4 w-4" />
                    <span>{explaining ? 'Thinking...' : 'Explain with AI'}</span>
                </Button>

                {existingHighlight && onDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Highlight</span>
                    </Button>
                )}
            </div>

            {showNoteInput && (
                <div className="px-2 pb-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                    <Textarea
                        placeholder="Write a note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="min-h-[80px] text-sm resize-none"
                        autoFocus
                    />
                    <div className="flex justify-end mt-2">
                        <Button size="sm" onClick={() => handleSave('highlight')} disabled={loading}>
                            {existingHighlight ? 'Update Note' : 'Save Note'}
                        </Button>
                    </div>
                </div>
            )}

            {explanation && (
                <div className="px-2 pb-2 pt-1 border-t bg-purple-50/50 rounded-b-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-purple-700">
                        <Sparkles className="h-3 w-3" />
                        <span>AI EXPLANATION</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-700 italic">
                        {explanation}
                    </p>
                    <div className="flex justify-end mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-purple-600 hover:bg-purple-100"
                            onClick={() => {
                                setNote((prev: string) => (prev ? `${prev}\n\nAI Explanation: ${explanation}` : `AI Explanation: ${explanation}`));
                                setShowNoteInput(true);
                                setExplanation(null);
                            }}
                        >
                            Add to Notes
                        </Button>
                    </div>
                </div>
            )}

            <QuoteCard
                isOpen={showQuoteCard}
                onClose={() => setShowQuoteCard(false)}
                quote={selectedText}
                bookTitle={bookTitle}
                author={author}
            />
        </div>
    );
}
