import { OpenAI } from 'openai';

if (!process.env['OPENAI_API_KEY']) {
    console.warn('OPENAI_API_KEY is not set. AI features might not work.');
}

export const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'] || '',
});

export const AI_MODELS = {
    SUMMARY: 'gpt-4o-mini',
    RECOMMENDATIONS: 'gpt-4o-mini',
    STUDY_TIPS: 'gpt-4o-mini',
    EXPLAIN: 'gpt-4o-mini',
};

export async function generateSummary(text: string, title: string, author?: string) {
    const response = await openai.chat.completions.create({
        model: AI_MODELS.SUMMARY,
        messages: [
            {
                role: 'system',
                content: 'You are a helpful reading assistant. Provide a concise, engaging summary of the book content provided. Focus on key themes, main arguments, and intended audience. Keep it under 200 words.',
            },
            {
                role: 'user',
                content: `Title: ${title}\nAuthor: ${author || 'Unknown'}\n\nContent Chunk:\n${text.substring(0, 15000)}`, // Limit to first 15k chars for now
            },
        ],
        temperature: 0.7,
    });

    return response.choices[0].message.content;
}

export async function explainHighlight(text: string, context: string) {
    const response = await openai.chat.completions.create({
        model: AI_MODELS.EXPLAIN,
        messages: [
            {
                role: 'system',
                content: 'You are an intellectual companion. Explain the following highlighted passage from a book, considering the broader context provided. Be insightful and clear.',
            },
            {
                role: 'user',
                content: `Highlight: "${text}"\n\nContext: "${context}"`,
            },
        ],
        temperature: 0.7,
    });

    return response.choices[0].message.content;
}
