import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createServerSupabaseClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    return Response.json({ session });
}
