import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Property, UserRole } from '@/types';
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

  if (!session) return { session: null, properties: [], userRole: 'admin' as UserRole, userEmail: '' };

  const userEmail = session.user.email || '';

  // Fetch user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  const userRole: UserRole = (roleData?.role as UserRole) || 'admin';

  // Superadmins see all properties; admins see only their own
  let query = supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (userRole !== 'superadmin') {
    query = query.eq('user_id', session.user.id);
  }

  const { data: properties } = await query;

  return { session, properties: (properties ?? []) as Property[], userRole, userEmail };
}

export default async function DashboardPage() {
  const { session, properties, userRole, userEmail } = await getSessionAndProperties();

  if (!session) redirect('/');

  return (
    <div className="min-h-screen dark:bg-brand-dark-bg bg-brand-light-bg">
      <Navbar />
      <main>
        <DashboardClient
          initialProperties={properties}
          userId={session.user.id}
          userRole={userRole}
          userEmail={userEmail}
        />
      </main>
    </div>
  );
}
