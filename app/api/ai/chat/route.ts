import { NextRequest, NextResponse } from 'next/server';

import { openai, AI_MODELS } from '@/lib/ai';
import { cleanText, extractTextFromBuffer } from '@/lib/extractor';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages, bookId } = await request.json();

        if (!bookId || !messages) {
            return NextResponse.json({ error: 'Book ID and messages required' }, { status: 400 });
        }

        // Get book details
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .eq('user_id', user.id)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // For a real chat, we'd want to RAG (Retrieval Augmented Generation) 
        // but for now, we'll provide a chunk of the book as context if it's a new chat.
        // Or just a general "knowledgeable about this book" prompt if we've summarized it.

        let context = '';
        if (book.summary) {
            context = `Summary of the book "${book.title}": ${book.summary}`;
        } else {
            // Try to get some text if no summary exists
            try {
                const response = await fetch(book.file_url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const text = await extractTextFromBuffer(buffer, book.format);
                    context = `Here is a chunk of text from the book "${book.title}" for context:\n${cleanText(text).substring(0, 5000)}`;
                }
            } catch (e) {
                console.warn('Could not fetch book for chat context');
            }
        }

        const response = await openai.chat.completions.create({
            model: AI_MODELS.EXPLAIN, // Reusing GTP-4o-mini for chat
            messages: [
                {
                    role: 'system',
                    content: `You are an intelligent reading companion for the book "${book.title}" by ${book.author || 'Unknown'}. 
          ${context ? `Use the following context if helpful: ${context}` : ''}
          Be helpful, insightful, and encourage the reader to engage more deeply with the material.`
                },
                ...messages
            ],
            temperature: 0.7,
        });

        return NextResponse.json({
            message: response.choices[0].message,
        });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Failed to chat with AI' }, { status: 500 });
    }
}
