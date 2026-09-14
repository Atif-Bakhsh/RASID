import { describe, expect, it } from 'vitest';
import {
  accountPatch,
  isCalendarDate,
  isPositiveMoney,
  transactionPatch,
} from './helpers';
import type {
  AccountRecord,
  CreateAccountInput,
  CreateTransactionInput,
  TransactionRecord,
} from './types';

const account: AccountRecord = {
  id: 'account',
  createdAt: '2026-09-01T00:00:00Z',
  userId: 'user',
  name: 'الحساب',
  type: 'CURRENT',
  currency: 'SAR',
  balance: '50.00',
  balanceAsOf: '2026-09-01T09:00:00+03:00',
};
const transaction: TransactionRecord = {
  id: 'transaction',
  createdAt: '2026-09-01T00:00:00Z',
  accountId: 'account',
  postedAt: '2026-09-10',
  amount: '42.50',
  direction: 'EXPENSE',
  merchant: 'متجر',
  categoryId: 'food',
  reference: 'receipt-1',
  fingerprint: 'hash',
  source: 'MANUAL',
  importId: null,
};

describe('ledger form payloads', () => {
  it('never includes immutable account fields and pairs changed balance/timestamp', () => {
    const input: CreateAccountInput = {
      ...account,
      type: 'CASH',
      currency: 'USD',
      name: 'الحساب',
    };
    expect(accountPatch(account, input)).toEqual({});
    expect(accountPatch(account, { ...input, balance: '60.00' })).toEqual({
      balance: '60.00',
      balanceAsOf: account.balanceAsOf,
    });
    expect(
      accountPatch(account, {
        ...input,
        balanceAsOf: '2026-09-02T09:00:00+03:00',
      }),
    ).toEqual({
      balance: account.balance,
      balanceAsOf: '2026-09-02T09:00:00+03:00',
    });
    expect(accountPatch(account, { ...input, name: 'معدل' })).toEqual({
      name: 'معدل',
    });
  });

  it('omits unchanged transaction fields but sends explicit null when clearing category/reference', () => {
    const input: CreateTransactionInput = {
      accountId: transaction.accountId,
      postedAt: transaction.postedAt,
      amount: transaction.amount,
      direction: transaction.direction,
      merchant: transaction.merchant,
      categoryId: transaction.categoryId,
      reference: transaction.reference,
    };
    expect(transactionPatch(transaction, input)).toEqual({});
    expect(
      transactionPatch(transaction, { ...input, categoryId: null }),
    ).toEqual({ categoryId: null });
    expect(
      transactionPatch(transaction, { ...input, reference: null }),
    ).toEqual({ reference: null });
    expect(
      transactionPatch(transaction, { ...input, accountId: 'another' }),
    ).toEqual({});
  });

  it('validates exact positive strings and real date-only values without converting them', () => {
    expect(isPositiveMoney('0.01')).toBe(true);
    expect(isPositiveMoney('999999999999.99')).toBe(true);
    expect(isPositiveMoney('0')).toBe(false);
    expect(isPositiveMoney('-1.00')).toBe(false);
    expect(isPositiveMoney('0.001')).toBe(false);
    expect(isCalendarDate('2026-09-30')).toBe(true);
    expect(isCalendarDate('2026-02-30')).toBe(false);
  });
});
