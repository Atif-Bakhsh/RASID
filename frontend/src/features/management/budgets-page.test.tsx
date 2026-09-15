import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/providers/locale-provider';
import { BudgetsPage } from './budgets-page';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ session: { user: { id: 'user-one' } } }),
}));

const category = {
  id: 'category-one',
  createdAt: '2026-01-01T00:00:00Z',
  ownerUserId: null,
  nameAr: 'الطعام',
  nameEn: 'Food',
  parentId: null,
};
const budget = {
  id: 'budget-one',
  categoryId: category.id,
  month: '2026-09',
  currency: 'SAR',
  limitAmount: '100.00',
  nameAr: 'الطعام',
  nameEn: 'Food',
  spent: '143.00',
  remaining: '-43.00',
  utilizationPercent: 143,
  isExceeded: true,
};
const inactive = {
  id: 'obligation-one',
  createdAt: '2026-01-01T00:00:00Z',
  userId: 'user-one',
  name: 'إيجار تقديري',
  amount: '900.00',
  currency: 'SAR',
  dueDay: 4,
  categoryId: category.id,
  isActive: false,
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
          <BudgetsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation((path: string, options?: RequestInit) => {
    if (path.startsWith('/budgets?'))
      return Promise.resolve({
        month: '2026-09',
        currency: 'SAR',
        data: [budget],
      });
    if (path === '/obligations?page=1&limit=20')
      return Promise.resolve({
        data: [inactive],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    if (path === '/categories') return Promise.resolve([category]);
    if (path === '/budgets/budget-one' && options?.method === 'PATCH')
      return Promise.resolve({
        id: budget.id,
        createdAt: '2026-01-01T00:00:00Z',
        userId: 'user-one',
        categoryId: budget.categoryId,
        month: budget.month,
        currency: budget.currency,
        limitAmount: (options.body as unknown as { limitAmount: string })
          .limitAmount,
      });
    if (path === '/obligations/obligation-one' && options?.method === 'PATCH')
      return Promise.resolve({ ...inactive, ...(options.body as object) });
    throw new Error(`Unexpected ${path}`);
  });
});

describe('BudgetsPage', () => {
  it('shows server-authoritative overspend facts without hiding the true percentage or negative remainder', async () => {
    setup();
    expect(await screen.findByText('143%')).toBeVisible();
    expect(screen.getByText('-43.00 SAR')).toBeVisible();
    expect(screen.getByText('متجاوزة')).toBeVisible();
    expect(screen.getByText(/هذا التصنيف فقط/)).toBeVisible();
    expect(screen.getByText(/غير نشط/)).toBeVisible();
    expect(screen.getByText(/ليست فواتير مدفوعة/)).toBeVisible();
  });

  it('patches only a budget limit and only changed obligation fields', async () => {
    const { user } = setup();
    await user.click(await screen.findByRole('button', { name: 'تعديل الحد' }));
    const limit = screen.getByLabelText('الحد');
    await user.clear(limit);
    await user.type(limit, '150.00');
    await user.click(screen.getByRole('button', { name: 'حفظ' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith('/budgets/budget-one', {
        method: 'PATCH',
        body: { limitAmount: '150.00' },
      }),
    );
    await user.click(screen.getByRole('button', { name: 'تعديل' }));
    const name = screen.getByLabelText('اسم الالتزام');
    await user.clear(name);
    await user.type(name, 'إيجار معدل');
    await user.click(screen.getByRole('button', { name: 'حفظ' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        '/obligations/obligation-one',
        { method: 'PATCH', body: { name: 'إيجار معدل' } },
      ),
    );
  });

  it('associates validation errors with the invalid budget controls', async () => {
    const { user } = setup();
    await user.click(
      await screen.findByRole('button', { name: 'إضافة ميزانية' }),
    );
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'حفظ' }));

    const category = within(dialog).getByLabelText('التصنيف');
    const limit = within(dialog).getByLabelText('الحد');
    expect(category).toHaveAttribute('aria-invalid', 'true');
    expect(limit).toHaveAttribute('aria-invalid', 'true');
    expect(
      document.getElementById(category.getAttribute('aria-describedby')!),
    ).toHaveTextContent('اختر تصنيفاً');
    expect(
      document.getElementById(limit.getAttribute('aria-describedby')!),
    ).toHaveTextContent('أدخل مبلغاً موجباً');
  });
});
