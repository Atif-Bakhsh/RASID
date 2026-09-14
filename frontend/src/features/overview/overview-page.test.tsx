import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageToggle } from '@/components/app-shell/language-toggle';
import { ApiClientError, ApiNetworkError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';
import { OverviewPage } from './overview-page';
import { formatMoney, monthStatus } from './format';
import type { Budgets, Insights, MonthlyAnalytics } from './types';

const mocks = vi.hoisted(() => ({ request: vi.fn(), userId: 'user-one' }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ session: { user: { id: mocks.userId } } }),
}));

// Contract-shaped synthetic fixtures; production components never import these.
const monthly: MonthlyAnalytics = {
  month: '2026-09',
  currency: 'SAR',
  income: '12300.00',
  spending: '4653.00',
  net: '7647.00',
  transactionCount: 13,
  dataMode: 'DEMO_ONLY',
  categories: [
    {
      categoryId: 'food',
      nameAr: 'الطعام',
      nameEn: 'Food',
      spending: '748.00',
      transactionCount: 4,
    },
  ],
  comparison: {
    previousMonth: '2026-08',
    income: '0.00',
    spending: '4000.00',
    transactionCount: 1,
    spendingChange: '653.00',
    spendingChangePercent: 16.32,
  },
  obligations: {
    total: '3200.00',
    interpretation: 'RECURRING_ESTIMATE_NOT_ADDITIONAL_SPENDING',
    items: [
      {
        id: 'rent',
        name: 'إيجار تجريبي',
        amount: '3200.00',
        currency: 'SAR',
        dueDay: 1,
        dueDate: '2026-09-01',
        isActive: true,
        categoryId: 'housing',
      },
    ],
  },
};
const budgets: Budgets = {
  month: '2026-09',
  currency: 'SAR',
  data: [
    {
      id: 'food-budget',
      categoryId: 'food',
      nameAr: 'الطعام',
      nameEn: 'Food',
      month: '2026-09',
      currency: 'SAR',
      limitAmount: '700.00',
      spent: '748.00',
      remaining: '-48.00',
      utilizationPercent: 106.85,
      isExceeded: true,
    },
  ],
};
const insights: Insights = {
  month: '2026-09',
  currency: 'SAR',
  dataMode: 'DEMO_ONLY',
  disclaimerAr: 'ملاحظات وصفية من بيانات تجريبية، وليست نصيحة مالية.',
  disclaimerEn:
    'Descriptive observations from demo data; not financial advice.',
  data: [
    {
      rule: 'BUDGET_EXCEEDED',
      version: 1,
      severity: 'warning',
      titleAr: 'تجاوز الميزانية',
      titleEn: 'Budget exceeded',
      explanationAr: 'مصروفات التصنيف تتجاوز الحد الذي حددته.',
      explanationEn: 'Category expenses exceed the limit you set.',
      facts: {
        budgetId: 'food-budget',
        spent: '748.00',
        limitAmount: '700.00',
      },
    },
  ],
};

function respond(path: string) {
  if (path.startsWith('/analytics/')) return Promise.resolve(monthly);
  if (path.startsWith('/budgets')) return Promise.resolve(budgets);
  if (path.startsWith('/insights')) return Promise.resolve(insights);
  throw new Error(`Unexpected request: ${path}`);
}
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const tree = (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <LanguageToggle />
        <OverviewPage />
      </LocaleProvider>
    </QueryClientProvider>
  );
  return { ...render(tree), client, tree, user: userEvent.setup() };
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation(respond);
  mocks.userId = 'user-one';
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe('Overview', () => {
  it('renders API totals unchanged, overspend facts and separate recurring estimates in Arabic', async () => {
    setup();
    const summary = await screen.findByRole('region', {
      name: 'الفترة المختارة',
    });
    expect(await within(summary).findByText('12,300.00')).toBeVisible();
    expect(within(summary).getByText('4,653.00')).toBeVisible();
    expect(within(summary).getByText('7,647.00')).toBeVisible();
    expect(within(summary).getByText('+16.32%')).toBeVisible();
    expect(within(summary).queryByText('3,200.00')).not.toBeInTheDocument();
    const obligations = screen.getByRole('region', {
      name: 'تقديرات الالتزامات المتكررة',
    });
    expect(within(obligations).getAllByText('3,200.00')).toHaveLength(2);
    expect(within(obligations).getByText('2026-09-01')).toHaveAttribute(
      'dir',
      'ltr',
    );
    expect(screen.getByText('-48.00')).toBeVisible();
    expect(screen.getByText('106.85%')).toBeVisible();
    expect(screen.getByText('تجاوز الحد')).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(mocks.request).toHaveBeenCalledTimes(3);
  });

  it('expands server facts/rule version and switches all UI copy and API copy to English without refetching', async () => {
    const { user } = setup();
    await screen.findByText('تجاوز الميزانية');
    await user.click(screen.getByText('لماذا أرى هذه الملاحظة؟'));
    expect(screen.getByText('BUDGET_EXCEEDED')).toBeVisible();
    expect(screen.getByText('food-budget')).toBeVisible();
    expect(screen.getByText('إصدار القاعدة')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'عرض الواجهة بالإنجليزية' }),
    );
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeVisible();
    expect(screen.getByText('Budget exceeded')).toBeVisible();
    expect(screen.getByText(insights.disclaimerEn)).toBeVisible();
    expect(screen.getByText('Rule version')).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(mocks.request).toHaveBeenCalledTimes(3);
  });

  it('shows loading without displaying empty or invented success data', () => {
    mocks.request.mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getAllByText('جارٍ تحميل البيانات…')).toHaveLength(5);
    expect(
      screen.queryByText('لا توجد معاملات لهذا الشهر والعملة.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('12,300.00')).not.toBeInTheDocument();
  });

  it('distinguishes empty transactions from budgets/obligations and represents a null baseline honestly', async () => {
    mocks.request.mockImplementation((path: string) =>
      path.startsWith('/analytics/')
        ? Promise.resolve({
            ...monthly,
            income: '0.00',
            spending: '0.00',
            net: '0.00',
            transactionCount: 0,
            categories: [],
            comparison: { ...monthly.comparison, spendingChangePercent: null },
          })
        : respond(path),
    );
    setup();
    expect(
      await screen.findByText('لا توجد معاملات لهذا الشهر والعملة.'),
    ).toBeVisible();
    expect(screen.getByText('لا يوجد أساس قابل للمقارنة')).toBeVisible();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
    expect(screen.getByText('-48.00')).toBeVisible();
    expect(screen.getByText('إيجار تجريبي')).toBeVisible();
  });

  it('renders empty budget, obligation and insight states independently', async () => {
    mocks.request.mockImplementation((path: string) =>
      Promise.resolve(
        path.startsWith('/analytics/')
          ? {
              ...monthly,
              obligations: { ...monthly.obligations, total: '0.00', items: [] },
            }
          : path.startsWith('/budgets')
            ? { ...budgets, data: [] }
            : { ...insights, data: [] },
      ),
    );
    setup();
    expect(
      await screen.findByText('لا توجد ميزانيات لهذا الشهر والعملة.'),
    ).toBeVisible();
    expect(
      screen.getByText('لا توجد التزامات نشطة بهذه العملة.'),
    ).toBeVisible();
    expect(
      screen.getByText('لا توجد ملاحظات ناتجة عن القواعد لهذه الفترة.'),
    ).toBeVisible();
    expect(screen.getByText(insights.disclaimerAr)).toBeVisible();
    expect(screen.getByText('12,300.00')).toBeVisible();
  });

  it('keeps successful sections visible on a network failure and retries only the failed section', async () => {
    mocks.request.mockImplementation((path: string) =>
      path.startsWith('/budgets')
        ? Promise.reject(new ApiNetworkError())
        : respond(path),
    );
    const { user } = setup();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'تعذر الوصول إلى RASID',
    );
    expect(screen.getByText('12,300.00')).toBeVisible();
    expect(screen.getByText('تجاوز الميزانية')).toBeVisible();
    expect(
      screen.queryByText('لا توجد ميزانيات لهذا الشهر والعملة.'),
    ).not.toBeInTheDocument();
    mocks.request.mockImplementation(respond);
    await user.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    expect(await screen.findByText('-48.00')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.request).toHaveBeenCalledTimes(4);
  });

  it('keeps category and obligation sections explicit while the shared analytics request fails', async () => {
    mocks.request.mockImplementation((path: string) =>
      path.startsWith('/analytics/')
        ? Promise.reject(new ApiNetworkError())
        : respond(path),
    );
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'تعذر الوصول إلى RASID',
    );
    expect(
      screen.getAllByText('تتوفر هذه التفاصيل بعد تحميل ملخص الفترة بنجاح.'),
    ).toHaveLength(2);
    expect(screen.getByText('-48.00')).toBeVisible();
    expect(screen.getByText('تجاوز الميزانية')).toBeVisible();
  });

  it('shows localized API errors and request IDs without exposing error stacks', async () => {
    mocks.request.mockImplementation((path: string) =>
      path.startsWith('/insights')
        ? Promise.reject(
            new ApiClientError(
              {
                error: {
                  code: 'SERVICE_UNAVAILABLE',
                  message: 'Service unavailable.',
                  messageAr: 'الخدمة غير متاحة.',
                },
                requestId: 'request-overview',
                timestamp: '2026-09-13T00:00:00Z',
              },
              503,
            ),
          )
        : respond(path),
    );
    const { user } = setup();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'الخدمة غير متاحة.',
    );
    await user.click(screen.getByText('مرجع الطلب'));
    expect(screen.getByText('request-overview')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'عرض الواجهة بالإنجليزية' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Service unavailable.');
    expect(screen.queryByText(/ApiClientError/)).not.toBeInTheDocument();
  });

  it('scopes all requests and caches by month/currency/user, hiding the old scope during loading', async () => {
    const { user, client, rerender } = setup();
    await screen.findByText('12,300.00');
    mocks.request.mockImplementation(() => new Promise(() => {}));
    await user.selectOptions(screen.getByLabelText('العملة'), 'USD');
    expect(screen.queryByText('12,300.00')).not.toBeInTheDocument();
    expect(screen.getAllByText('جارٍ تحميل البيانات…')).toHaveLength(5);
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(6));
    for (const [path, options] of mocks.request.mock.calls.slice(3)) {
      expect(path).toContain('currency=USD');
      expect(options.signal).toBeInstanceOf(AbortSignal);
    }
    fireEvent.change(screen.getByLabelText('الشهر'), {
      target: { value: '2026-07' },
    });
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(9));
    expect(
      mocks.request.mock.calls
        .slice(6)
        .every(([path]) => path.includes('month=2026-07&currency=USD')),
    ).toBe(true);
    mocks.userId = 'user-two';
    rerender(
      <QueryClientProvider client={client}>
        <LocaleProvider>
          <OverviewPage />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(12));
    expect(
      client
        .getQueryCache()
        .getAll()
        .some((query) => query.queryKey[1] === 'user-two'),
    ).toBe(true);
    expect(screen.queryByText('12,300.00')).not.toBeInTheDocument();
  });

  it('does not request an invalid month and refreshes all three resources on demand', async () => {
    const { user } = setup();
    await screen.findByText('12,300.00');
    await user.click(screen.getByRole('button', { name: 'تحديث البيانات' }));
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(6));
    fireEvent.change(screen.getByLabelText('الشهر'), { target: { value: '' } });
    expect(screen.getByRole('alert')).toHaveTextContent('اختر شهراً صالحاً');
    expect(
      screen.getByRole('button', { name: 'تحديث البيانات' }),
    ).toBeDisabled();
    expect(screen.queryByText('12,300.00')).not.toBeInTheDocument();
    expect(mocks.request).toHaveBeenCalledTimes(6);
  });

  it('marks the current month as incomplete and future records separately', async () => {
    setup();
    expect(
      screen.getByText(
        'الشهر لم ينتهِ بعد؛ المقارنة مع شهر سابق كامل قد تكون غير متكافئة.',
      ),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('الشهر'), {
      target: { value: '2099-12' },
    });
    expect(
      screen.getByText('هذا شهر مستقبلي؛ الأرقام تعكس السجلات المدخلة له فقط.'),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('الشهر'), {
      target: { value: '2000-01' },
    });
    expect(
      screen.queryByText(
        'الشهر لم ينتهِ بعد؛ المقارنة مع شهر سابق كامل قد تكون غير متكافئة.',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'الأرقام تخص السجلات المدخلة فقط؛ انتهاء الشهر لا يعني اكتمال البيانات.',
      ),
    ).toBeVisible();
    await screen.findByText('12,300.00');
  });

  it('reuses fresh scope-specific cache when returning to a previously viewed currency', async () => {
    const { user } = setup();
    await screen.findByText('12,300.00');
    mocks.request.mockImplementation(() => new Promise(() => {}));
    await user.selectOptions(screen.getByLabelText('العملة'), 'EUR');
    expect(screen.queryByText('12,300.00')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('العملة'), 'SAR');
    expect(await screen.findByText('12,300.00')).toBeVisible();
    expect(mocks.request).toHaveBeenCalledTimes(6);
  });
});

describe('Exact display and calendar-month semantics', () => {
  it('groups very large positive and negative decimal strings without floating-point loss', () => {
    expect(formatMoney('999999999999999999.99')).toBe(
      '999,999,999,999,999,999.99',
    );
    expect(formatMoney('-1234567.01')).toBe('-1,234,567.01');
    expect(formatMoney('0.00')).toBe('0.00');
  });
  it('uses the backend UTC month boundary and distinguishes current/future/past', () => {
    const now = new Date('2026-09-13T12:00:00Z');
    expect(monthStatus('2026-09', now)).toBe('current');
    expect(monthStatus('2026-10', now)).toBe('future');
    expect(monthStatus('2026-08', now)).toBe('past');
    expect(monthStatus('2026-09', new Date('2026-10-01T00:30:00+03:00'))).toBe(
      'current',
    );
  });
});
