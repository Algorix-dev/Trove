import { redirect } from 'next/navigation';

import { BadgesList } from '@/components/features/profile/badges-list';
import { ProfileHeader } from '@/components/features/profile/profile-header';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Fetch books read count
  const { count: booksRead } = await supabase
    .from('reading_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('progress_percentage', 100);

  // Fetch total reading time
  const { data: sessions } = await supabase
    .from('reading_sessions')
    .select('duration_minutes')
    .eq('user_id', user.id);

  const totalMinutes = sessions?.reduce((acc, session) => acc + session.duration_minutes, 0) || 0;

  const stats = {
    booksRead: booksRead || 0,
    streak: profile?.current_streak || 0,
    highestStreak: profile?.highest_streak || 0,
    totalMinutes: totalMinutes,
  };

  // Combine auth user data with profile data
  const userData = {
    full_name: profile?.['full_name'] || user.user_metadata?.['full_name'],
    email: user.email,
    avatar_url: profile?.['avatar_url'] || user.user_metadata?.['avatar_url'],
    created_at: user.created_at,
    rank: profile?.['rank'],
    rank_title: profile?.['rank_title'],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ProfileHeader user={userData} stats={stats} />
      <BadgesList />
    </div>
  );
}
