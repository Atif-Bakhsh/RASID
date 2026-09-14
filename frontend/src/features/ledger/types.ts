import type { Currency, Direction, Money, Page } from '@/lib/api/contracts';

export type AccountType = 'CURRENT' | 'SAVINGS' | 'CASH';
export type TransactionSource = 'MANUAL' | 'CSV' | 'SYNTHETIC';

export interface AccountRecord {
  id: string;
  createdAt: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: Money;
  balanceAsOf: string;
}

export interface CategoryRecord {
  id: string;
  createdAt: string;
  ownerUserId: string | null;
  nameAr: string;
  nameEn: string;
  parentId: string | null;
}

export interface TransactionRecord {
  id: string;
  createdAt: string;
  accountId: string;
  postedAt: string;
  amount: Money;
  direction: Direction;
  merchant: string;
  categoryId: string | null;
  reference: string | null;
  fingerprint: string;
  source: TransactionSource;
  importId: string | null;
}

export type AccountPage = Page<AccountRecord>;
export type TransactionPage = Page<TransactionRecord>;

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: Currency;
  balance: Money;
  balanceAsOf: string;
}

export interface UpdateAccountInput {
  name?: string;
  balance?: Money;
  balanceAsOf?: string;
}

export interface CreateTransactionInput {
  accountId: string;
  postedAt: string;
  amount: Money;
  direction: Direction;
  merchant: string;
  categoryId?: string | null;
  reference?: string | null;
}

export type UpdateTransactionInput = Partial<
  Omit<CreateTransactionInput, 'accountId'>
>;

export interface TransactionFilters {
  page: number;
  limit: number;
  accountId: string;
  categoryId: string;
  direction: '' | Direction;
  currency: '' | Currency;
  from: string;
  to: string;
  search: string;
  orderBy: 'postedAt' | 'amount' | 'createdAt';
  order: 'ASC' | 'DESC';
}
