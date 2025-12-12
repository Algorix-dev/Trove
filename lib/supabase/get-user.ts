// lib/supabase/get-user.ts
import { createServerSupabaseClient } from './server'

export async function getUserFromServer() {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
}
