import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()
    redirect("/login")
}
