import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '@/providers/locale-provider';

import { AnonymousRoute, ProtectedRoute } from './auth-route';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  restoreSession: vi.fn(),
  status: 'anonymous' as
    | 'anonymous'
    | 'authenticated'
    | 'bootstrapping'
    | 'unavailable',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    restoreSession: mocks.restoreSession,
    status: mocks.status,
  }),
}));

function renderWithLocale(node: React.ReactNode) {
  return render(<LocaleProvider>{node}</LocaleProvider>);
}

describe('authentication route guards', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.restoreSession.mockReset();
    mocks.status = 'anonymous';
  });

  it('keeps protected content hidden and redirects an anonymous visitor', async () => {
    renderWithLocale(
      <ProtectedRoute>
        <p>private content</p>
      </ProtectedRoute>,
    );

    expect(screen.queryByText('private content')).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
  });

  it('renders protected content only for an authenticated session', () => {
    mocks.status = 'authenticated';
    renderWithLocale(
      <ProtectedRoute>
        <p>private content</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText('private content')).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('redirects an authenticated visitor away from login and registration', async () => {
    mocks.status = 'authenticated';
    renderWithLocale(
      <AnonymousRoute>
        <p>public auth form</p>
      </AnonymousRoute>,
    );

    expect(screen.queryByText('public auth form')).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
  });
});
