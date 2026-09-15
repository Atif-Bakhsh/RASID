import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';
import { SettingsPage } from './settings-page';

const mocks = vi.hoisted(() => ({ request: vi.fn(), signOut: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    session: { sessionId: 'session-current', user: { id: 'user-one' } },
    signOut: mocks.signOut,
  }),
}));
const shared = {
  id: 'shared-one',
  createdAt: '2026-01-01T00:00:00Z',
  ownerUserId: null,
  nameAr: 'مشترك',
  nameEn: 'Shared',
  parentId: null,
};
const privateCategory = {
  id: 'private-one',
  createdAt: '2026-01-01T00:00:00Z',
  ownerUserId: 'user-one',
  nameAr: 'خاص',
  nameEn: 'Private',
  parentId: null,
};
const currentSession = {
  id: 'session-current',
  createdAt: '2026-09-01T00:00:00Z',
  userId: 'user-one',
  expiresAt: '2026-09-15T00:00:00Z',
  revokedAt: null,
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={client}>
        <LocaleProvider>
          <SettingsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.signOut.mockReset();
  mocks.signOut.mockResolvedValue(undefined);
  mocks.request.mockImplementation((path: string, options?: RequestInit) => {
    if (path === '/categories')
      return Promise.resolve([shared, privateCategory]);
    if (path === '/auth/sessions') return Promise.resolve([currentSession]);
    if (path === '/categories/private-one' && options?.method === 'DELETE')
      return Promise.reject(
        new ApiClientError(
          {
            error: {
              code: 'CONFLICT',
              message: 'Referenced.',
              messageAr: 'مرتبط.',
            },
            requestId: 'category-conflict',
            timestamp: '2026-09-14T00:00:00Z',
          },
          409,
        ),
      );
    if (
      path === '/auth/sessions/session-current' &&
      options?.method === 'DELETE'
    )
      return Promise.resolve(undefined);
    throw new Error(`Unexpected ${path}`);
  });
});

describe('SettingsPage', () => {
  it('keeps shared categories read-only and explains private-category deletion conflicts', async () => {
    const { user } = setup();
    expect(await screen.findByText('تصنيفات مشتركة')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'تعديل' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'حذف' }));
    await user.click(screen.getByRole('button', { name: 'تأكيد الحذف' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'مرتبط بمعاملات أو تصنيفات فرعية أو ميزانيات أو التزامات',
    );
    expect(screen.getByText('category-conflict')).toBeInTheDocument();
  });

  it('marks the known current session and clears authentication after revoking it', async () => {
    const { user } = setup();
    expect(await screen.findByText('الجلسة الحالية')).toBeVisible();
    expect(screen.getByText('session-current')).toBeVisible();
    expect(screen.queryByText('اسم الجهاز')).not.toBeInTheDocument();
    expect(screen.queryByText('آخر نشاط')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'إلغاء الجلسة' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'إلغاء الجلسة',
      }),
    );
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
