import { NextRequest, NextResponse } from 'next/server';

import { generateSummary } from '@/lib/ai';
import { cleanText, extractTextFromBuffer } from '@/lib/extractor';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID required' }, { status: 400 });
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

    // Check if summary already exists (caching)
    if (book.summary) {
      return NextResponse.json({
        summary: book.summary,
        book: {
          title: book.title,
          author: book.author,
        },
        cached: true,
      });
    }

    // 1. Extract text from the book file
    let bookText = '';
    try {
      const response = await fetch(book.file_url);
      if (!response.ok) throw new Error('Failed to fetch book file');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      bookText = await extractTextFromBuffer(buffer, book.format);
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      return NextResponse.json({ error: 'Failed to extract text from book' }, { status: 500 });
    }

    if (!bookText || bookText.trim().length === 0) {
      return NextResponse.json({ error: 'No text content found in book' }, { status: 400 });
    }

    // 2. Call OpenAI API to generate summary
    const summary = await generateSummary(cleanText(bookText), book.title, book.author);

    if (!summary) {
      throw new Error('AI failed to generate summary');
    }

    // 3. Cache the result in the database
    await supabase
      .from('books')
      .update({ summary })
      .eq('id', bookId);

    return NextResponse.json({
      summary,
      book: {
        title: book.title,
        author: book.author,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
