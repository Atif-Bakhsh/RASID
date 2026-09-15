import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/noto-kufi-arabic/600.css';
import '@fontsource/noto-kufi-arabic/700.css';

import { DemoNotice } from '@/components/app-shell/demo-notice';
import { AppProviders } from '@/providers/app-providers';

import './globals.css';

export const metadata: Metadata = {
  applicationName: 'RASID',
  title: {
    default: 'RASID — وضوح مالي',
    template: '%s | RASID',
  },
  description:
    'وضوح مالي من بيانات تجريبية فقط، دون اتصال بالبنوك. Financial clarity from demo data only.',
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'RASID',
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    title: 'RASID — وضوح مالي',
    description:
      'واجهة عربية أولاً لإدارة بيانات مالية تجريبية فقط، دون اتصال بالبنوك.',
  },
  twitter: {
    card: 'summary',
    title: 'RASID — وضوح مالي',
    description: 'Financial clarity from synthetic and sanitized demo data.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <AppProviders>
          <DemoNotice />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
