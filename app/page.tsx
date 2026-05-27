import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import LoginForm from '@/components/login-form';

export default async function HomePage() {
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

  const { data: { session } } = await supabase.auth.getSession();
  if (session) redirect('/dashboard');

  return <LoginForm />;
}
