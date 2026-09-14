import { queryOptions } from '@tanstack/react-query';
import { getImport, listImports } from './api';

export const importQueries = {
  list: (userId: string, page: number) =>
    queryOptions({
      queryKey: ['imports', userId, 'page', page, 20],
      queryFn: ({ signal }) => listImports(page, 20, signal),
      enabled: !!userId,
    }),
  detail: (userId: string, id: string | null) =>
    queryOptions({
      queryKey: ['imports', userId, 'detail', id],
      queryFn: ({ signal }) => getImport(id!, signal),
      enabled: !!userId && !!id,
    }),
};
