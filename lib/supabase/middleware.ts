import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

<<<<<<< HEAD
    // Refreshing the auth token
    await supabase.auth.getUser()
=======
    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes pattern
    const protectedPaths = ['/dashboard']
    const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    // Auth condition
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
         return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!user && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
>>>>>>> 45bc0a3 (Fix authentication loops and implement dashboard features)

    return supabaseResponse
}
