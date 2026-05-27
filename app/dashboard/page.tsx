import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Property } from '@/types';
import Navbar from '@/components/navbar';
import DashboardClient from '@/components/dashboard-client';

async function getSessionAndProperties() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // No-op for Server Components
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { session: null, properties: [] };

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return { session, properties: (properties ?? []) as Property[] };
}

export default async function DashboardPage() {
  const { session, properties } = await getSessionAndProperties();

  if (!session) redirect('/');

  return (
    <div className="min-h-screen dark:bg-brand-dark-bg bg-brand-light-bg">
      <Navbar />
      <main>
        <DashboardClient
          initialProperties={properties}
          userId={session.user.id}
        />
      </main>
    </div>
  );
}
