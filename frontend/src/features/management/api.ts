import { protectedApiRequest } from '@/lib/api/client';
import type { Currency } from '@/lib/api/contracts';
import type {
  BudgetList,
  BudgetRecord,
  CategoryInput,
  CategoryRecord,
  CreateBudgetInput,
  ObligationInput,
  ObligationPage,
  ObligationRecord,
  SessionRecord,
} from './types';

export const listBudgets = (
  month: string,
  currency: Currency,
  signal?: AbortSignal,
) =>
  protectedApiRequest<BudgetList>(
    `/budgets?${new URLSearchParams({ month, currency })}`,
    { signal },
  );
export const createBudget = (body: CreateBudgetInput) =>
  protectedApiRequest<BudgetRecord>('/budgets', { method: 'POST', body });
export const updateBudget = (id: string, limitAmount: string) =>
  protectedApiRequest<BudgetRecord>(`/budgets/${id}`, {
    method: 'PATCH',
    body: { limitAmount },
  });
export const deleteBudget = (id: string) =>
  protectedApiRequest<void>(`/budgets/${id}`, { method: 'DELETE' });

export const listObligations = (page: number, signal?: AbortSignal) =>
  protectedApiRequest<ObligationPage>(`/obligations?page=${page}&limit=20`, {
    signal,
  });
export const createObligation = (body: ObligationInput) =>
  protectedApiRequest<ObligationRecord>('/obligations', {
    method: 'POST',
    body,
  });
export const updateObligation = (id: string, body: Partial<ObligationInput>) =>
  protectedApiRequest<ObligationRecord>(`/obligations/${id}`, {
    method: 'PATCH',
    body,
  });
export const deleteObligation = (id: string) =>
  protectedApiRequest<void>(`/obligations/${id}`, { method: 'DELETE' });

export const createCategory = (body: CategoryInput) =>
  protectedApiRequest<CategoryRecord>('/categories', { method: 'POST', body });
export const updateCategory = (
  id: string,
  body: Partial<Pick<CategoryInput, 'nameAr' | 'nameEn'>>,
) =>
  protectedApiRequest<CategoryRecord>(`/categories/${id}`, {
    method: 'PATCH',
    body,
  });
export const deleteCategory = (id: string) =>
  protectedApiRequest<void>(`/categories/${id}`, { method: 'DELETE' });

export const listSessions = (signal?: AbortSignal) =>
  protectedApiRequest<SessionRecord[]>('/auth/sessions', { signal });
export const revokeSession = (id: string) =>
  protectedApiRequest<void>(`/auth/sessions/${id}`, { method: 'DELETE' });
