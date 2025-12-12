// app/api/test-session/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return new Response(JSON.stringify({ session }), { headers: { "Content-Type": "application/json" } })
}
