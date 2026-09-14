import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthSession } from '@/lib/api/contracts';
import { ApiClientError } from '@/lib/api/errors';

import { LocaleProvider } from './locale-provider';
import { AuthProvider, useAuth } from './auth-provider';

const mocks = vi.hoisted(() => ({
  coordinatedRefresh: vi.fn(),
  logout: vi.fn(),
  publishLogout: vi.fn(),
  publishSession: vi.fn(),
  subscribe: vi.fn(() => () => undefined),
}));

vi.mock('@/features/auth/api', () => ({ logout: mocks.logout }));
vi.mock('@/features/auth/refresh-coordinator', () => ({
  coordinatedRefresh: mocks.coordinatedRefresh,
  publishLogout: mocks.publishLogout,
  publishSession: mocks.publishSession,
  subscribeToAuthEvents: mocks.subscribe,
}));

const session: AuthSession = {
  accessToken: 'restored-memory-token',
  expiresIn: 900,
  sessionId: '62aef265-9cce-41d8-a33d-eedd81ef0a1a',
  tokenType: 'Bearer',
  user: {
    createdAt: '2026-09-12T10:00:00.000Z',
    dataMode: 'DEMO_ONLY',
    email: 'atif@example.test',
    id: 'f72afe0a-c153-49b4-b675-c4d6d8ce6c23',
    locale: 'ar',
    timezone: 'Asia/Riyadh',
  },
};

function AuthProbe() {
  const { logoutWarning, session: currentSession, signOut, status } = useAuth();
  return (
    <div>
      <span>{status}</span>
      <span>{logoutWarning ? 'logout warning' : 'no logout warning'}</span>
      {currentSession && <span>{currentSession.user.email}</span>}
      <button
        type="button"
        onClick={() => void signOut().catch(() => undefined)}
      >
        sign out
      </button>
    </div>
  );
}

function renderProvider(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mocks.coordinatedRefresh.mockReset();
    mocks.logout.mockReset();
    mocks.logout.mockResolvedValue(undefined);
    mocks.publishLogout.mockReset();
    mocks.publishSession.mockReset();
    mocks.subscribe.mockClear();
  });

  it('restores the startup session and clears user-scoped cache on logout', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    queryClient.setQueryData(['user', 'cached'], { private: true });
    mocks.coordinatedRefresh.mockResolvedValue(session);
    renderProvider(queryClient);

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByText('atif@example.test')).toBeInTheDocument();
    expect(mocks.coordinatedRefresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'sign out' }));

    await waitFor(() =>
      expect(screen.getByText('anonymous')).toBeInTheDocument(),
    );
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(mocks.publishLogout).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('treats a startup refresh 401 as anonymous instead of unavailable', async () => {
    const queryClient = new QueryClient();
    mocks.coordinatedRefresh.mockRejectedValue(
      new ApiClientError(
        {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Sign in again to continue.',
            messageAr: 'يرجى تسجيل الدخول مجدداً.',
          },
          requestId: 'request-startup-401',
          timestamp: '2026-09-12T10:00:00.000Z',
        },
        401,
      ),
    );
    renderProvider(queryClient);

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('clears local state but preserves an honest warning when logout cannot reach the API', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    queryClient.setQueryData(['user', 'cached'], { private: true });
    mocks.coordinatedRefresh.mockResolvedValue(session);
    mocks.logout.mockRejectedValue(new Error('network unavailable'));
    renderProvider(queryClient);

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'sign out' }));

    await waitFor(() =>
      expect(screen.getByText('anonymous')).toBeInTheDocument(),
    );
    expect(screen.getByText('logout warning')).toBeInTheDocument();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
