import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';
import { TransactionsPage } from './transactions-page';
import type {
  AccountPage,
  AccountRecord,
  CategoryRecord,
  TransactionPage,
  TransactionRecord,
} from './types';

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
const category: CategoryRecord = {
  id: 'food',
  createdAt: '2026-09-01T00:00:00Z',
  ownerUserId: null,
  nameAr: 'الطعام',
  nameEn: 'Food',
  parentId: null,
};
const transaction: TransactionRecord = {
  id: 'transaction-one',
  createdAt: '2026-09-10T10:00:00Z',
  accountId: account.id,
  postedAt: '2026-09-10',
  amount: '42.50',
  direction: 'EXPENSE',
  merchant: 'متجر تجريبي',
  categoryId: category.id,
  reference: null,
  fingerprint: 'hash',
  source: 'MANUAL',
  importId: null,
};
const accountPage: AccountPage = {
  data: [account],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};
const transactionPage = (page = 1, data = [transaction]): TransactionPage => ({
  data,
  meta: { page, limit: 20, total: 21, totalPages: 2 },
});

function defaultResponse(path: string, options?: RequestInit) {
  if (path === '/accounts?page=1&limit=100')
    return Promise.resolve(accountPage);
  if (path === '/categories') return Promise.resolve([category]);
  if (path.startsWith('/transactions?')) {
    const page = new URLSearchParams(path.split('?')[1]).get('page');
    return Promise.resolve(transactionPage(Number(page)));
  }
  if (path === `/transactions/${transaction.id}` && options?.method === 'PATCH')
    return Promise.resolve({ ...transaction, ...(options.body as object) });
  throw new Error(`Unexpected ${path}`);
}
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
          <TransactionsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    ),
  };
}
beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation(defaultResponse);
});

describe('TransactionsPage', () => {
  it('renders complete server records and keeps postedAt as the exact date-only string', async () => {
    setup();
    const table = within(await screen.findByRole('table'));
    expect(table.getByText('متجر تجريبي')).toBeVisible();
    expect(table.getByText('2026-09-10')).toHaveAttribute('dir', 'ltr');
    expect(table.getByText('42.50')).toBeVisible();
    expect(table.getByText('الحساب الجاري')).toBeVisible();
    expect(table.getByText('الطعام')).toBeVisible();
    expect(table.getByText('مصروف')).toBeVisible();
    expect(table.getByText('يدوي')).toBeVisible();
  });

  it('uses backend pagination and resets to page one when filters or debounced search change', async () => {
    const { user } = setup();
    await screen.findByText('متجر تجريبي');
    await user.click(screen.getByRole('button', { name: 'التالي' }));
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.some(
          ([path]) =>
            path.includes('/transactions?') && path.includes('page=2'),
        ),
      ).toBe(true),
    );
    await user.selectOptions(screen.getByLabelText('الاتجاه'), 'EXPENSE');
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.some(
          ([path]) =>
            path.includes('page=1') && path.includes('direction=EXPENSE'),
        ),
      ).toBe(true),
    );
    await user.type(screen.getByLabelText('بحث في التاجر'), 'Coffee%_');
    await waitFor(
      () =>
        expect(
          mocks.request.mock.calls.some(
            ([path]) =>
              path.includes('page=1') && path.includes('search=Coffee%25_'),
          ),
        ).toBe(true),
      { timeout: 1000 },
    );
  });

  it('sends categoryId null and no other transaction fields when category alone is cleared', async () => {
    const { user, client } = setup();
    const invalidations = vi.spyOn(client, 'invalidateQueries');
    await screen.findByText('متجر تجريبي');
    await user.click(
      screen.getByRole('button', { name: 'تعديل: متجر تجريبي' }),
    );
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByLabelText('الحساب')).toBeDisabled();
    await user.selectOptions(dialog.getByLabelText('التصنيف'), '');
    await user.click(dialog.getByRole('button', { name: 'حفظ' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        `/transactions/${transaction.id}`,
        { method: 'PATCH', body: { categoryId: null } },
      ),
    );
    for (const key of ['transactions', 'analytics', 'budgets', 'insights'])
      expect(invalidations).toHaveBeenCalledWith({
        queryKey: [key, 'user-one'],
      });
    expect(await screen.findByText('حُفظت المعاملة بنجاح.')).toBeVisible();
  });

  it('surfaces DUPLICATE_TRANSACTION and offers meaningful reference input instead of generating one', async () => {
    mocks.request.mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/transactions' && options?.method === 'POST')
        return Promise.reject(
          new ApiClientError(
            {
              error: {
                code: 'DUPLICATE_TRANSACTION',
                message: 'Duplicate.',
                messageAr: 'مكرر.',
              },
              requestId: 'duplicate-request',
              timestamp: '2026-09-13T00:00:00Z',
            },
            409,
          ),
        );
      return defaultResponse(path, options);
    });
    const { user } = setup();
    await screen.findByText('متجر تجريبي');
    await user.click(screen.getByRole('button', { name: 'إضافة معاملة' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('التاريخ'), '2026-09-10');
    await user.type(dialog.getByLabelText('المبلغ'), '42.50');
    await user.type(dialog.getByLabelText('الوصف / التاجر'), 'متجر تجريبي');
    await user.click(dialog.getByRole('button', { name: 'حفظ' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'توجد معاملة مطابقة في هذا الحساب',
    );
    expect(dialog.getByLabelText('مرجع مميز')).toHaveValue('');
    expect(
      mocks.request.mock.calls.find(([path]) => path === '/transactions')?.[1]
        ?.body,
    ).not.toHaveProperty('reference');
  });

  it('does not query an invalid date range and distinguishes an empty server page', async () => {
    mocks.request.mockImplementation((path: string, options?: RequestInit) =>
      path.startsWith('/transactions?')
        ? Promise.resolve(transactionPage(1, []))
        : defaultResponse(path, options),
    );
    const { user } = setup();
    expect(
      await screen.findByText('لا توجد معاملات تطابق هذه الفلاتر.'),
    ).toBeVisible();
    const before = mocks.request.mock.calls.filter(([path]) =>
      path.startsWith('/transactions?'),
    ).length;
    await user.type(screen.getByLabelText('من تاريخ'), '2026-09-30');
    await user.type(screen.getByLabelText('إلى تاريخ'), '2026-09-01');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'بداية الفترة يجب ألا تتجاوز نهايتها',
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(
      mocks.request.mock.calls.filter(([path]) =>
        path.startsWith('/transactions?'),
      ).length,
    ).toBe(before + 1);
  });
});
