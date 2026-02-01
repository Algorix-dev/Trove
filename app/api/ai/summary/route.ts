import { NextRequest, NextResponse } from 'next/server';

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

    // For now, return a placeholder summary
    // In production, you'd:
    // 1. Extract text from the book file
    // 2. Call OpenAI API to generate summary
    // 3. Cache the result

    return NextResponse.json({
      summary: `Summary for "${book.title}" by ${book.author || 'Unknown'}. This is a placeholder summary. In production, this would be generated using AI based on the book's content.`,
      book: {
        title: book.title,
        author: book.author,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
