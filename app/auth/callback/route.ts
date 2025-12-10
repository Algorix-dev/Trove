import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
        console.error('Auth error:', error, errorDescription)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`)
    }

    if (code) {
        try {
            const cookieStore = await cookies()

            // Create Supabase client with proper cookie handling
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll()
                        },
                        setAll(cookiesToSet) {
                            try {
                                cookiesToSet.forEach(({ name, value, options }) =>
                                    cookieStore.set(name, value, options)
                                )
                            } catch {
                                // Cookie setting might fail in middleware
                            }
                        },
                    },
                }
            )

            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('Session exchange error:', exchangeError)
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Failed to complete authentication')}`)
            }

            // Redirect to dashboard after successful authentication
            return NextResponse.redirect(`${origin}/dashboard`)
        } catch (err) {
            console.error('Unexpected auth error:', err)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('An unexpected error occurred')}`)
        }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(`${origin}/login`)
}
