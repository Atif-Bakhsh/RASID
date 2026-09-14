import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, ApiNetworkError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';
import { AccountsPage } from './accounts-page';
import type { AccountRecord } from './types';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ session: { user: { id: 'user-one' } } }),
}));
const account: AccountRecord = {
  id: 'account-one',
  createdAt: '2026-09-01T00:00:00Z',
  userId: 'user-one',
  name: 'الحساب الجاري',
  type: 'CURRENT',
  currency: 'SAR',
  balance: '5000.00',
  balanceAsOf: '2026-09-01T09:00:00+03:00',
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    user: userEvent.setup(),
    client,
    ...render(
      <QueryClientProvider client={client}>
        <LocaleProvider>
          <AccountsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    ),
  };
}
beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation((path: string, options?: RequestInit) => {
    if (path === '/accounts?page=1&limit=20')
      return Promise.resolve({
        data: [account],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    if (path === `/accounts/${account.id}` && !options?.method)
      return Promise.resolve(account);
    if (path === `/accounts/${account.id}` && options?.method === 'PATCH')
      return Promise.resolve({ ...account, ...(options.body as object) });
    throw new Error(`Unexpected ${path}`);
  });
});

describe('AccountsPage', () => {
  it('loads backend detail and sends only the changed account field', async () => {
    const { user } = setup();
    await user.click(
      await screen.findByRole('button', { name: /الحساب الجاري/ }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'تعديل الحساب' }),
    );
    const name = screen.getByLabelText('اسم الحساب');
    await user.clear(name);
    await user.type(name, 'حساب معدل');
    expect(screen.getByLabelText('نوع الحساب')).toBeDisabled();
    expect(screen.getByLabelText('العملة')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'حفظ' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(`/accounts/${account.id}`, {
        method: 'PATCH',
        body: { name: 'حساب معدل' },
      }),
    );
    expect(await screen.findByText('حُفظ الحساب بنجاح.')).toBeVisible();
  });

  it('shows a specific honest conflict while retaining the delete confirmation', async () => {
    mocks.request.mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/accounts?page=1&limit=20')
        return Promise.resolve({
          data: [account],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
      if (path === `/accounts/${account.id}` && !options?.method)
        return Promise.resolve(account);
      if (options?.method === 'DELETE')
        return Promise.reject(
          new ApiClientError(
            {
              error: {
                code: 'CONFLICT',
                message: 'Conflict.',
                messageAr: 'تعارض.',
              },
              requestId: 'account-conflict',
              timestamp: '2026-09-13T00:00:00Z',
            },
            409,
          ),
        );
      throw new Error('unexpected');
    });
    const { user } = setup();
    await user.click(
      await screen.findByRole('button', { name: /الحساب الجاري/ }),
    );
    await user.click(await screen.findByRole('button', { name: 'حذف الحساب' }));
    await user.click(screen.getByRole('button', { name: 'تأكيد الحذف' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'لا يمكن حذف هذا الحساب لأنه مرتبط بمعاملات أو عمليات استيراد',
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('account-conflict')).toBeInTheDocument();
  });

  it('distinguishes loading, network error and empty results', async () => {
    mocks.request.mockReturnValueOnce(new Promise(() => {}));
    const pending = setup();
    expect(screen.getByText('جارٍ تحميل الحسابات…')).toBeVisible();
    pending.unmount();
    pending.client.clear();
    mocks.request.mockRejectedValueOnce(new ApiNetworkError());
    const failed = setup();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'تعذر الوصول إلى RASID',
    );
    failed.unmount();
    failed.client.clear();
    mocks.request.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    setup();
    expect(await screen.findByText('لا توجد حسابات يدوية بعد.')).toBeVisible();
  });
});
