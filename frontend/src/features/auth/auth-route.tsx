'use client';

import { LoaderCircle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { BrandMark } from '@/components/app-shell/brand-mark';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

function RouteStatus({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <main className="route-status" id="main-content" aria-live="polite">
      <div className="route-status-card" role="status">
        <BrandMark />
        <LoaderCircle className="route-status-spinner" aria-hidden="true" />
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { restoreSession, status } = useAuth();
  const { messages } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [router, status]);

  if (status === 'bootstrapping') {
    return (
      <RouteStatus
        title={messages.restoringSession}
        description={messages.restoringSessionDescription}
      />
    );
  }

  if (status === 'unavailable') {
    return (
      <main className="route-status" id="main-content">
        <div
          className="route-status-card route-status-card--error"
          role="alert"
        >
          <BrandMark />
          <h1>{messages.unavailableSessionTitle}</h1>
          <p>{messages.unavailableSessionDescription}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => void restoreSession()}
          >
            <RotateCcw size={17} aria-hidden="true" />
            {messages.retryConnection}
          </button>
        </div>
      </main>
    );
  }

  if (status === 'anonymous') {
    return <RouteStatus title={messages.redirecting} />;
  }

  return children;
}

export function AnonymousRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { messages } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [router, status]);

  if (status === 'bootstrapping') {
    return (
      <RouteStatus
        title={messages.restoringSession}
        description={messages.restoringSessionDescription}
      />
    );
  }

  if (status === 'authenticated') {
    return <RouteStatus title={messages.redirecting} />;
  }

  return children;
}
