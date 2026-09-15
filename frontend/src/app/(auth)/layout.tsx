import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { AnonymousRoute } from '@/features/auth/auth-route';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthenticationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AnonymousRoute>
      <AuthShell>{children}</AuthShell>
    </AnonymousRoute>
  );
}
