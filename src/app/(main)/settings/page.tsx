import { redirect } from 'next/navigation';

// /settings redirects to the default sub-page: Profile
export default function SettingsPage() {
  redirect('/settings/profile');
}