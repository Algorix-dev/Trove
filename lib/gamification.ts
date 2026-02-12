import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

export const GamificationService = {
  async awardXP(userId: string, amount: number, action: string, bookId?: string, metadata?: { startPage?: number; endPage?: number }) {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    try {
      // 1. Get current stats
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_xp, current_level')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const newXP = (profile?.total_xp || 0) + amount;

      // 2. Update XP
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_xp: newXP })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. Log Reading Session if applicable
      if (bookId && action === 'Reading Time') {
        const today = new Date().toISOString().split('T')[0];

        // Instead of single(), fetch all for today and aggregate or pick the first
        // Better yet: we use a sophisticated upsert if the DB has a unique constraint.
        // For now, let's fetch to be safe but handle multiple.
        const { data: sessions } = await supabase
          .from('reading_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .eq('session_date', today);

        if (sessions && sessions.length > 0) {
          const mainSession = sessions[0];
          const newStartPage = metadata?.startPage ? Math.min(mainSession.start_page || 99999, metadata.startPage) : mainSession.start_page;
          const newEndPage = metadata?.endPage ? Math.max(mainSession.end_page || 0, metadata.endPage) : mainSession.end_page;

          await supabase
            .from('reading_sessions')
            .update({
              duration_minutes: mainSession.duration_minutes + amount,
              start_page: newStartPage,
              end_page: newEndPage
            })
            .eq('id', mainSession.id);
        } else {
          await supabase.from('reading_sessions').insert({
            user_id: userId,
            book_id: bookId,
            session_date: today,
            duration_minutes: amount,
            start_page: metadata?.startPage || 0,
            end_page: metadata?.endPage || 0
          });
        }
      }

      return { success: true, newXP };
    } catch (error) {
      console.error('[Gamification] Error awarding XP:', error);
      return { success: false };
    }
  },

  async checkAndUnlockAchievement(userId: string, achievementCode: string) {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    try {
      // 1. Get achievement ID
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id, name, xp_reward')
        .eq('code', achievementCode)
        .single();

      if (!achievement) return;

      // 2. Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (existing) return; // Already unlocked

      // 3. Unlock
      const { error: matchError } = await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: achievement.id });

      if (matchError) {
        // likely unique constraint race condition
        return;
      }

      // 4. Award XP for achievement
      await this.awardXP(userId, achievement.xp_reward, `Achievement: ${achievement.name}`);

      // 5. Notify
      toast.success(`Achievement Unlocked: ${achievement.name}!`, {
        description: `You earned ${achievement.xp_reward} XP`,
        icon: '🏆', // We can replace with actual icon component later
      });
    } catch (error) {
      console.error('[Gamification] Error checking achievement:', error);
    }
  },
};
