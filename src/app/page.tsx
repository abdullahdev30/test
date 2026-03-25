import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Root "/" route:
// - if session cookies exist (access or refresh), go to /dashboard
// - otherwise go to /login
export default async function RootPage() {
  const cookieStore = await cookies();
  const hasAccess = !!cookieStore.get('access_token')?.value;
  const hasRefresh = !!cookieStore.get('refresh_token')?.value;

  if (hasAccess || hasRefresh) {
    redirect('/dashboard');
  }

  redirect('/login');
}
