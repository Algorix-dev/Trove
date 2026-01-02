// lib/supabase/get-user.ts
import { createClient } from './server';

export async function getUserFromServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}
