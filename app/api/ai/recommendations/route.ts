import { NextRequest, NextResponse } from 'next/server';

import { openai, AI_MODELS } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's reading history and preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('favorite_genres, favorite_books, favorite_authors')
      .eq('user_id', user.id)
      .single();

    const { data: readingHistory } = await supabase
      .from('reading_progress')
      .select('progress_percentage, books(title, author, format)')
      .eq('user_id', user.id)
      .gt('progress_percentage', 10); // Books they've actually started

    // Generate AI recommendations
    const prompt = `
      User Preferences:
      - Favorite Genres: ${preferences?.favorite_genres?.join(', ') || 'Not specified'}
      - Favorite Authors: ${preferences?.favorite_authors?.join(', ') || 'Not specified'}
      
      Reading History (Completed/In Progress):
      ${readingHistory?.map(h => `- "${(h.books as any).title}" by ${(h.books as any).author || 'Unknown'} (${h.progress_percentage}% read)`).join('\n') || 'No history yet'}
      
      Based on this, suggest 5 books the user might enjoy. For each book, provide:
      1. Title
      2. Author
      3. A short "Why you'll love it" reason (max 20 words).
      
      Format as a JSON array of objects with keys: title, author, reason.
    `;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.RECOMMENDATIONS,
      messages: [
        { role: 'system', content: 'You are a professional librarian and book recommender. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const recommendations = content ? JSON.parse(content).recommendations || JSON.parse(content) : [];

    return NextResponse.json({
      recommendations: Array.isArray(recommendations) ? recommendations : [recommendations],
      basedOn: {
        genres: preferences?.favorite_genres || [],
        historyCount: readingHistory?.length || 0,
      },
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
