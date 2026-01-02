import { redirect } from 'next/navigation';

import { QuotesList } from '@/components/features/quotes/quotes-list';
import { createClient } from '@/lib/supabase/server';

export default async function QuotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Saved Quotes</h2>
        <p className="text-muted-foreground">Your collection of memorable passages and insights</p>
      </div>

      <QuotesList userId={user.id} />
    </div>
  );
}
