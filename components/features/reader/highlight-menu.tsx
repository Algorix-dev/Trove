'use client';

import {
    Highlighter,
    MessageSquare,
    Quote,
    X
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    pageNumber?: number;
    chapter?: string;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}

export function HighlightMenu({
    selectedText,
    onSave,
    onClose,
    pageNumber,
    chapter,
}: HighlightMenuProps) {
    const [note, setNote] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async (type: 'highlight' | 'quote') => {
        setLoading(true);
        try {
            await onSave({
                quote_text: selectedText,
                note: note || null,
                color: selectedColor,
                highlight_type: type,
                page_number: pageNumber,
                chapter: chapter,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save highlight:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 bg-background border shadow-xl rounded-xl p-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Highlight</span>
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
                    <span>Highlight Only</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    disabled={loading}
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>Add Note</span>
                </Button>

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
                            Save Note
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
