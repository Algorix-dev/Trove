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

    // Get user's reading patterns from reading_progress or a sessions table if it exists
    const { data: progress } = await supabase
      .from('reading_progress')
      .select('updated_at, progress_percentage, books(title)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    // Generate AI study tips
    const prompt = `
      Recent Reading Activity:
      ${progress?.map(p => `- Read "${(p.books as any).title}" to ${p.progress_percentage}% on ${new Date(p.updated_at).toLocaleDateString()}`).join('\n') || 'No recent activity'}
      
      Based on this reading pattern, provide 4 personalized study or reading tips to improve retention and focus.
      
      Format as a JSON array of objects with keys: title, description, type (e.g., consistency, timing, health, goals).
    `;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.STUDY_TIPS,
      messages: [
        { role: 'system', content: 'You are a learning coach. provide actionable, encouraging advice. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const tips = content ? JSON.parse(content).tips || JSON.parse(content) : [];

    return NextResponse.json({
      tips: Array.isArray(tips) ? tips : [tips],
      analytics: {
        recentBooks: progress?.length || 0,
      },
    });
  } catch (error) {
    console.error('Study tips error:', error);
    return NextResponse.json({ error: 'Failed to generate study tips' }, { status: 500 });
  }
}
