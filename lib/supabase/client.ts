import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'trove-session',
                // @ts-ignore
                chunk: true,
                // @ts-ignore
                chunkSize: 1000,
                maxAge: 60 * 60 * 24 * 7, // 1 week
                domain: '',
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
        }
    )
}
