'use client';

import { createBrowserClient } from '@supabase/ssr';
import { BookOpen, Clock, Flame, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardStats() {
  const [stats, setStats] = useState({
    streak: 0,
    totalMinutes: 0,
    booksRead: 0,
    dailyGoal: 30,
    todayMinutes: 0,
    readingNow: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data in parallel
      const [profileData, preferencesData, progressData, sessionsData] = await Promise.all([
        // Fetch profile for streak
        supabase.from('profiles').select('current_streak').eq('id', user.id).maybeSingle(),

        // Fetch preferences for daily goal
        supabase
          .from('user_preferences')
          .select('reading_goal_minutes')
          .eq('user_id', user.id)
          .maybeSingle(),

        // Fetch books for progress stats
        supabase.from('books').select('progress_percentage').eq('user_id', user.id),

        // Fetch all reading sessions
        supabase
          .from('reading_sessions')
          .select('duration_minutes, session_date')
          .eq('user_id', user.id),
      ]);

      // Calculate books read
      const booksRead = progressData.data?.filter((p) => p.progress_percentage === 100).length || 0;

      // Calculate books currently reading
      const readingNow =
        progressData.data?.filter((p) => p.progress_percentage > 0 && p.progress_percentage < 100)
          .length || 0;

      // Calculate total and today's minutes
      const totalMinutes =
        sessionsData.data?.reduce((acc, session) => acc + session.duration_minutes, 0) || 0;
      const today = new Date().toISOString().split('T')[0];
      const todayMinutes =
        sessionsData.data
          ?.filter((session) => session.session_date === today)
          .reduce((acc, session) => acc + session.duration_minutes, 0) || 0;

      setStats({
        streak: profileData.data?.current_streak || 0,
        totalMinutes,
        booksRead,
        dailyGoal: preferencesData.data?.reading_goal_minutes || 30,
        todayMinutes,
        readingNow,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.streak} Days</div>
          <p className="text-xs text-muted-foreground">Keep it up!</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Minutes</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayMinutes}</div>
          <p className="text-xs text-muted-foreground">Reading time today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Books Read</CardTitle>
          <BookOpen className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.booksRead}</div>
          <p className="text-xs text-muted-foreground">Completed books</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.todayMinutes}/{stats.dailyGoal}
          </div>
          <p className="text-xs text-muted-foreground">Minutes today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reading Now</CardTitle>
          <BookOpen className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.readingNow}</div>
          <p className="text-xs text-muted-foreground">Active Books</p>
        </CardContent>
      </Card>
    </div>
  );
}
