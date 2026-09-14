import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiNetworkError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';
import { ImportsPage } from './imports-page';
import type { ImportDetail, ImportPage } from './types';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ session: { user: { id: 'user-one' } } }),
}));

const account = {
  id: 'account-one',
  createdAt: '2026-09-01T00:00:00Z',
  userId: 'user-one',
  name: 'الحساب التجريبي',
  type: 'CURRENT' as const,
  currency: 'SAR' as const,
  balance: '5000.00',
  balanceAsOf: '2026-09-01T09:00:00+03:00',
};
const acceptedRow = {
  row: 2,
  status: 'ACCEPTED' as const,
  errors: [],
  record: {
    postedAt: '2026-09-21',
    amount: '35.50',
    direction: 'EXPENSE' as const,
    merchant: 'قهوة اصطناعية',
    categoryId: null,
    reference: 'csv-demo-001',
    fingerprint: 'fingerprint-one',
  },
};
const basePreview: ImportDetail = {
  id: 'import-one',
  createdAt: '2026-09-13T10:00:00Z',
  userId: 'user-one',
  accountId: account.id,
  filename: 'synthetic.csv',
  contentHash: 'hash',
  status: 'PREVIEW',
  committedAt: null,
  result: null,
  summary: { total: 1, accepted: 1, duplicates: 0, invalid: 0 },
  rows: [acceptedRow],
};
const emptyHistory: ImportPage = {
  data: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

function baseResponse(path: string, options?: RequestInit) {
  if (path === '/accounts?page=1&limit=100')
    return Promise.resolve({
      data: [account],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  if (path === '/categories') return Promise.resolve([]);
  if (path === '/imports?page=1&limit=20') return Promise.resolve(emptyHistory);
  if (
    path === '/imports/accounts/account-one/preview' &&
    options?.method === 'POST'
  )
    return Promise.resolve(basePreview);
  throw new Error(`Unexpected ${path}`);
}

function setup(options?: Parameters<typeof userEvent.setup>[0]) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
  return {
    user: userEvent.setup(options),
    client,
    ...render(
      <QueryClientProvider client={client}>
        <LocaleProvider>
          <ImportsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    ),
  };
}

async function uploadPreview(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('لا توجد عمليات استيراد بعد.');
  await user.selectOptions(
    screen.getByLabelText('الحساب اليدوي المملوك'),
    account.id,
  );
  const file = new File(
    ['postedAt,amount,direction,merchant\n2026-09-21,35.50,EXPENSE,قهوة'],
    'synthetic.csv',
    { type: 'text/csv' },
  );
  await user.upload(screen.getByLabelText('ملف CSV'), file);
  await user.click(screen.getByRole('button', { name: 'معاينة الملف' }));
  return file;
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation(baseResponse);
});

describe('ImportsPage', () => {
  it('presents limits and renders a server preview without parsing counts in the browser', async () => {
    const { user } = setup();
    const file = await uploadPreview(user);
    expect(screen.getByText('الحد الأقصى 512 كيلوبايت.')).toBeVisible();
    expect(screen.getByText('من سجل واحد إلى 1,000 سجل بيانات.')).toBeVisible();
    expect(screen.getByText(/لا ترفع كشف حساب حقيقياً/)).toBeVisible();
    const previewCall = mocks.request.mock.calls.find(([path]) =>
      path.includes('/preview'),
    );
    expect(previewCall?.[1]?.headers).toBeUndefined();
    expect(Array.from((previewCall?.[1]?.body as FormData).entries())).toEqual([
      ['file', file],
    ]);
    const table = within(await screen.findByRole('table'));
    expect(table.getByText('2')).toBeVisible();
    expect(table.getByText('مقبول')).toBeVisible();
    expect(table.getByText('2026-09-21')).toBeVisible();
    expect(table.getByText('35.50')).toBeVisible();
    expect(table.getByText('قهوة اصطناعية')).toBeVisible();
  });

  it('requires acknowledgment for invalid rows and displays server commit counts that differ from preview', async () => {
    const invalidPreview: ImportDetail = {
      ...basePreview,
      summary: { total: 3, accepted: 1, duplicates: 1, invalid: 1 },
      rows: [
        acceptedRow,
        {
          ...acceptedRow,
          row: 3,
          status: 'DUPLICATE',
          errors: ['DUPLICATE_IN_FILE'],
        },
        {
          row: 4,
          status: 'INVALID',
          errors: ['AMOUNT_MUST_BE_POSITIVE'],
        },
      ],
    };
    const committed: ImportDetail = {
      ...invalidPreview,
      status: 'COMMITTED',
      committedAt: '2026-09-13T10:02:00Z',
      result: { inserted: 0, duplicates: 2, invalid: 1 },
    };
    mocks.request.mockImplementation((path: string, options?: RequestInit) => {
      if (path.includes('/preview')) return Promise.resolve(invalidPreview);
      if (path === '/imports/import-one/commit')
        return Promise.resolve(committed);
      return baseResponse(path, options);
    });
    const { user } = setup();
    await uploadPreview(user);
    expect(screen.getByText('صف مطابق داخل الملف.')).toBeVisible();
    expect(screen.getByText('يجب أن يكون المبلغ موجباً.')).toBeVisible();
    const commitButton = screen.getByRole('button', {
      name: 'تأكيد الصفوف المقبولة',
    });
    expect(commitButton).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', {
        name: /راجعت أخطاء الصفوف/,
      }),
    );
    await user.click(commitButton);
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith('/imports/import-one/commit', {
        method: 'POST',
        body: { acknowledgeRejectedRows: true },
      }),
    );
    expect(await screen.findByText('نتيجة التأكيد الفعلية')).toBeVisible();
    expect(
      screen.getByText(/قد تختلف نتيجة التأكيد عن المعاينة/),
    ).toBeVisible();
  });

  it('loads historical import details and preserves the committed result', async () => {
    const committed: ImportDetail = {
      ...basePreview,
      filename: 'history.csv',
      status: 'COMMITTED',
      committedAt: '2026-09-13T10:02:00Z',
      result: { inserted: 1, duplicates: 0, invalid: 0 },
    };
    mocks.request.mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/imports?page=1&limit=20')
        return Promise.resolve({
          data: [committed],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
      if (path === '/imports/import-one') return Promise.resolve(committed);
      return baseResponse(path, options);
    });
    const { user } = setup();
    await user.click(
      await screen.findByRole('button', { name: /history\.csv/ }),
    );
    expect(await screen.findByText('نتيجة التأكيد الفعلية')).toBeVisible();
    expect(screen.getByText(/نتيجة تاريخية محفوظة/)).toBeVisible();
    expect(mocks.request).toHaveBeenCalledWith('/imports/import-one', {
      signal: expect.any(AbortSignal),
    });
  });

  it('rejects wrong-type and oversized files locally and surfaces upload network errors honestly', async () => {
    const { user } = setup({ applyAccept: false });
    await screen.findByText('لا توجد عمليات استيراد بعد.');
    await user.selectOptions(
      screen.getByLabelText('الحساب اليدوي المملوك'),
      account.id,
    );
    const fileInput = screen.getByLabelText('ملف CSV');
    await user.upload(fileInput, new File(['x'], 'statement.txt'));
    await user.click(screen.getByRole('button', { name: 'معاينة الملف' }));
    expect(screen.getByRole('alert')).toHaveTextContent('بامتداد .csv فقط');

    await user.upload(
      fileInput,
      new File([new Uint8Array(512 * 1024 + 1)], 'large.csv', {
        type: 'text/csv',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'معاينة الملف' }));
    expect(screen.getByRole('alert')).toHaveTextContent('يتجاوز 512');

    mocks.request.mockImplementation((path: string, options?: RequestInit) =>
      path.includes('/preview')
        ? Promise.reject(new ApiNetworkError())
        : baseResponse(path, options),
    );
    await user.upload(
      fileInput,
      new File(['postedAt,amount,direction,merchant'], 'network.csv', {
        type: 'text/csv',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'معاينة الملف' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'تعذر الوصول إلى RASID',
    );
  });
});
