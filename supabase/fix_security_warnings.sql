-- Fix security warnings by setting explicit search_path for functions

-- Fix mutable search path for functions
ALTER FUNCTION public.update_user_streak() SET search_path = public;
ALTER FUNCTION public.update_user_level() SET search_path = public;
ALTER FUNCTION public.check_achievements() SET search_path = public;
ALTER FUNCTION public.handle_xp_gain() SET search_path = public;
ALTER FUNCTION public.check_duplicate_session() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_reading_goal_progress() SET search_path = public;

-- Depending on your setup, you might also want to set it for the auth trigger function if it exists and wasn't covered
-- ALTER FUNCTION public.on_auth_user_created() SET search_path = public;
