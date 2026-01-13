import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  const hasSessionCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'));
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLandingPage = request.nextUrl.pathname === '/';

  // Optimization:
  // 1. If on dashboard, we MUST refresh the user session to prevent redirect loops.
  // 2. If elsewhere (like landing), we only refresh if cookies exist, to avoid unnecessary work.
  // 3. We skip refresh on the absolute landing page for maximum speed for new visitors.

  if (hasSessionCookie) {
    if (isDashboardRoute || !isLandingPage) {
      await supabase.auth.getUser();
    }
  }

  return supabaseResponse;
}
