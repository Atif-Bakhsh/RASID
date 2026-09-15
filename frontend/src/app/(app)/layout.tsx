import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/features/auth/auth-route';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
