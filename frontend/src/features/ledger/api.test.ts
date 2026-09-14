import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAllAccounts, transactionSearchParams } from './api';
import { ledgerQueries } from './queries';
import type { AccountRecord, TransactionFilters } from './types';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));

const account = (id: string): AccountRecord => ({
  id,
  createdAt: '2026-09-01T00:00:00Z',
  userId: 'user',
  name: id,
  type: 'CURRENT',
  currency: 'SAR',
  balance: '1.00',
  balanceAsOf: '2026-09-01T09:00:00+03:00',
});

beforeEach(() => mocks.request.mockReset());

describe('ledger API query boundaries', () => {
  it('loads every backend account page for the transaction dictionary', async () => {
    mocks.request
      .mockResolvedValueOnce({
        data: [account('one')],
        meta: { page: 1, limit: 100, total: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        data: [account('two')],
        meta: { page: 2, limit: 100, total: 2, totalPages: 2 },
      });
    await expect(listAllAccounts()).resolves.toEqual([
      account('one'),
      account('two'),
    ]);
    expect(mocks.request.mock.calls.map(([path]) => path)).toEqual([
      '/accounts?page=1&limit=100',
      '/accounts?page=2&limit=100',
    ]);
  });

  it('serializes only supported non-empty transaction filters', () => {
    const filters: TransactionFilters = {
      page: 3,
      limit: 20,
      accountId: 'account',
      categoryId: '',
      direction: 'EXPENSE',
      currency: 'SAR',
      from: '2026-09-01',
      to: '2026-09-30',
      search: '100%_literal',
      orderBy: 'amount',
      order: 'ASC',
    };
    const params = transactionSearchParams(filters);
    expect(Object.fromEntries(params)).toEqual({
      page: '3',
      limit: '20',
      orderBy: 'amount',
      order: 'ASC',
      accountId: 'account',
      direction: 'EXPENSE',
      currency: 'SAR',
      from: '2026-09-01',
      to: '2026-09-30',
      search: '100%_literal',
    });
    expect(params.has('categoryId')).toBe(false);
  });

  it('scopes account, category and transaction cache keys to the authenticated user', () => {
    const filters: TransactionFilters = {
      page: 1,
      limit: 20,
      accountId: '',
      categoryId: '',
      direction: '',
      currency: '',
      from: '',
      to: '',
      search: '',
      orderBy: 'postedAt',
      order: 'DESC',
    };
    expect(ledgerQueries.accountList('user-one', 1).queryKey).not.toEqual(
      ledgerQueries.accountList('user-two', 1).queryKey,
    );
    expect(ledgerQueries.accountDictionary('user-one').queryKey).not.toEqual(
      ledgerQueries.accountDictionary('user-two').queryKey,
    );
    expect(ledgerQueries.categories('user-one').queryKey).not.toEqual(
      ledgerQueries.categories('user-two').queryKey,
    );
    expect(
      ledgerQueries.transactions('user-one', filters).queryKey,
    ).not.toEqual(ledgerQueries.transactions('user-two', filters).queryKey);
  });
});
