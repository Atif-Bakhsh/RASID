import { queryOptions } from '@tanstack/react-query';
import { protectedApiRequest } from '@/lib/api/client';
import type { Budgets, Insights, MonthlyAnalytics, MonthScope } from './types';

// Resource prefixes support the handoff's later mutation invalidations.
function options<T>(
  resource: string,
  path: `/${string}`,
  userId: string,
  scope: MonthScope,
) {
  return queryOptions({
    queryKey: [resource, userId, scope.month, scope.currency],
    queryFn: ({ signal }) =>
      protectedApiRequest<T>(`${path}?${new URLSearchParams({ ...scope })}`, {
        signal,
      }),
    enabled: !!userId && /^20\d{2}-(0[1-9]|1[0-2])$/.test(scope.month),
    staleTime: 30_000,
  });
}
export const overviewQueries = {
  monthly: (userId: string, scope: MonthScope) =>
    options<MonthlyAnalytics>('analytics', '/analytics/monthly', userId, scope),
  budgets: (userId: string, scope: MonthScope) =>
    options<Budgets>('budgets', '/budgets', userId, scope),
  insights: (userId: string, scope: MonthScope) =>
    options<Insights>('insights', '/insights', userId, scope),
};
