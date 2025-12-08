import { createClient } from '@/lib/supabase/server'
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
            const supabase = await createClient()
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
                console.error('Session exchange error:', exchangeError)
                return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Failed to complete authentication')}`)
            }
        } catch (err) {
            console.error('Unexpected auth error:', err)
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('An unexpected error occurred')}`)
        }
    }

    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(`${origin}/dashboard`)
}
