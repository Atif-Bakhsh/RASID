import type { Metadata } from 'next';
import { SettingsPage } from '@/features/management/settings-page';

export const metadata: Metadata = {
  title: 'الإعدادات والجلسات · Settings & sessions',
};

export default function Page() {
  return <SettingsPage />;
}
