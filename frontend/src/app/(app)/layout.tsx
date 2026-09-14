import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/features/auth/auth-route';

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
