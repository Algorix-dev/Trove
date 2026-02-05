import { NextRequest, NextResponse } from 'next/server';

import { explainHighlight } from '@/lib/ai';
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

        const { text, context } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Highlight text required' }, { status: 400 });
        }

        // Generate explanation
        const explanation = await explainHighlight(text, context || '');

        return NextResponse.json({
            explanation,
        });
    } catch (error) {
        console.error('Explain highlight error:', error);
        return NextResponse.json({ error: 'Failed to explain highlight' }, { status: 500 });
    }
}
