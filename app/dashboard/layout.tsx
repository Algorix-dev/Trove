import { redirect } from 'next/navigation';

import { DashboardHeader } from '@/components/features/dashboard-header';
import { DashboardSidebar } from '@/components/features/dashboard-sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <DashboardSidebar />
      </div>
      <main className="md:pl-72">
        <DashboardHeader />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
