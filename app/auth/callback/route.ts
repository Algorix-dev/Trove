import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    const origin = requestUrl.origin

    if (error) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`
        )
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/login`)
    }

    // Create a Response object so Supabase can attach cookies to it
    let response = NextResponse.redirect(`${origin}/dashboard`)
    const cookieStore = cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'trove-session',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent('Failed to complete authentication')}`
        )
    }

    return response
}
