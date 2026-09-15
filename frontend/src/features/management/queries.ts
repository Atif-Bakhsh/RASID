import { queryOptions } from '@tanstack/react-query';
import type { Currency } from '@/lib/api/contracts';
import { listBudgets, listObligations, listSessions } from './api';

export const managementQueries = {
  budgets: (userId: string, month: string, currency: Currency) =>
    queryOptions({
      queryKey: ['budgets', userId, month, currency],
      queryFn: ({ signal }) => listBudgets(month, currency, signal),
      enabled: !!userId && /^20\d{2}-(0[1-9]|1[0-2])$/.test(month),
    }),
  obligations: (userId: string, page: number) =>
    queryOptions({
      queryKey: ['obligations', userId, 'page', page, 20],
      queryFn: ({ signal }) => listObligations(page, signal),
      enabled: !!userId,
    }),
  sessions: (userId: string) =>
    queryOptions({
      queryKey: ['sessions', userId],
      queryFn: ({ signal }) => listSessions(signal),
      enabled: !!userId,
    }),
};
