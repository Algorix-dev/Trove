import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'trove-session',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
        }
    )
}
