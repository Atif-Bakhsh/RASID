import { protectedApiRequest } from '@/lib/api/client';
import type {
  AccountPage,
  AccountRecord,
  CategoryRecord,
  CreateAccountInput,
  CreateTransactionInput,
  TransactionFilters,
  TransactionPage,
  TransactionRecord,
  UpdateAccountInput,
  UpdateTransactionInput,
} from './types';

export const listAccounts = (page: number, limit = 20, signal?: AbortSignal) =>
  protectedApiRequest<AccountPage>(`/accounts?page=${page}&limit=${limit}`, {
    signal,
  });

export const getAccount = (id: string, signal?: AbortSignal) =>
  protectedApiRequest<AccountRecord>(`/accounts/${id}`, { signal });

export const createAccount = (body: CreateAccountInput) =>
  protectedApiRequest<AccountRecord>('/accounts', { method: 'POST', body });

export const updateAccount = (id: string, body: UpdateAccountInput) =>
  protectedApiRequest<AccountRecord>(`/accounts/${id}`, {
    method: 'PATCH',
    body,
  });

export const deleteAccount = (id: string) =>
  protectedApiRequest<void>(`/accounts/${id}`, { method: 'DELETE' });

export async function listAllAccounts(signal?: AbortSignal) {
  const all: AccountRecord[] = [];
  let page = 1;
  do {
    const response = await listAccounts(page, 100, signal);
    all.push(...response.data);
    if (page >= response.meta.totalPages) break;
    page += 1;
  } while (true);
  return all;
}

export const listCategories = (signal?: AbortSignal) =>
  protectedApiRequest<CategoryRecord[]>('/categories', { signal });

export function transactionSearchParams(filters: TransactionFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
    orderBy: filters.orderBy,
    order: filters.order,
  });
  for (const key of [
    'accountId',
    'categoryId',
    'direction',
    'currency',
    'from',
    'to',
    'search',
  ] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  return params;
}

export const listTransactions = (
  filters: TransactionFilters,
  signal?: AbortSignal,
) =>
  protectedApiRequest<TransactionPage>(
    `/transactions?${transactionSearchParams(filters)}`,
    { signal },
  );

export const createTransaction = (body: CreateTransactionInput) =>
  protectedApiRequest<TransactionRecord>('/transactions', {
    method: 'POST',
    body,
  });

export const updateTransaction = (id: string, body: UpdateTransactionInput) =>
  protectedApiRequest<TransactionRecord>(`/transactions/${id}`, {
    method: 'PATCH',
    body,
  });

export const deleteTransaction = (id: string) =>
  protectedApiRequest<void>(`/transactions/${id}`, { method: 'DELETE' });
