import { redirect } from 'next/navigation';

// Root "/" redirects to /login.
// Middleware sends already-logged-in users to /dashboard.
export default function RootPage() {
  redirect('/login');
}