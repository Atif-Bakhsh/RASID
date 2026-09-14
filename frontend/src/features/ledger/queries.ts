import { queryOptions } from '@tanstack/react-query';
import {
  getAccount,
  listAccounts,
  listAllAccounts,
  listCategories,
  listTransactions,
} from './api';
import type { TransactionFilters } from './types';

export const ledgerQueries = {
  accountList: (userId: string, page: number) =>
    queryOptions({
      queryKey: ['accounts', userId, 'page', page, 20],
      queryFn: ({ signal }) => listAccounts(page, 20, signal),
      enabled: !!userId,
    }),
  accountDetail: (userId: string, id: string | null) =>
    queryOptions({
      queryKey: ['accounts', userId, 'detail', id],
      queryFn: ({ signal }) => getAccount(id!, signal),
      enabled: !!userId && !!id,
    }),
  accountDictionary: (userId: string) =>
    queryOptions({
      queryKey: ['account-dictionary', userId],
      queryFn: ({ signal }) => listAllAccounts(signal),
      enabled: !!userId,
    }),
  categories: (userId: string) =>
    queryOptions({
      queryKey: ['category-dictionary', userId],
      queryFn: ({ signal }) => listCategories(signal),
      enabled: !!userId,
    }),
  transactions: (userId: string, filters: TransactionFilters) =>
    queryOptions({
      queryKey: ['transactions', userId, filters],
      queryFn: ({ signal }) => listTransactions(filters, signal),
      enabled:
        !!userId &&
        (!filters.from || !filters.to || filters.from <= filters.to),
    }),
};
