import { createClient } from './server';

export async function serverSupabaseRest(url: string, opts: RequestInit = {}) {
  const supabase = await createClient();
  // server components can use supabase.from() directly; this helper can be used for legacy REST calls
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
      apikey: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      'Content-Type': 'application/json',
    },
  });

  return res;
}
