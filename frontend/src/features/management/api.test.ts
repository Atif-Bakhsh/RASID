import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBudget,
  createCategory,
  createObligation,
  deleteBudget,
  deleteCategory,
  deleteObligation,
  listBudgets,
  listObligations,
  listSessions,
  revokeSession,
  updateBudget,
  updateCategory,
  updateObligation,
} from './api';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));

beforeEach(() => mocks.request.mockReset().mockResolvedValue({}));

describe('management API boundaries', () => {
  it('uses scoped budget routes and only sends limitAmount when editing', async () => {
    await listBudgets('2026-09', 'SAR');
    await createBudget({
      categoryId: 'category-one',
      month: '2026-09',
      currency: 'SAR',
      limitAmount: '700.00',
    });
    await updateBudget('budget-one', '725.50');
    await deleteBudget('budget-one');

    expect(mocks.request.mock.calls).toEqual([
      ['/budgets?month=2026-09&currency=SAR', { signal: undefined }],
      [
        '/budgets',
        {
          method: 'POST',
          body: {
            categoryId: 'category-one',
            month: '2026-09',
            currency: 'SAR',
            limitAmount: '700.00',
          },
        },
      ],
      [
        '/budgets/budget-one',
        { method: 'PATCH', body: { limitAmount: '725.50' } },
      ],
      ['/budgets/budget-one', { method: 'DELETE' }],
    ]);
  });

  it('preserves partial obligation and category PATCH bodies including null', async () => {
    await listObligations(2);
    await createObligation({
      name: 'Estimate',
      amount: '10.00',
      currency: 'SAR',
      dueDay: 1,
      categoryId: null,
      isActive: false,
    });
    await updateObligation('obligation-one', { categoryId: null });
    await deleteObligation('obligation-one');
    await createCategory({ nameAr: 'خاص', nameEn: 'Private' });
    await updateCategory('category-one', { nameEn: 'Renamed' });
    await deleteCategory('category-one');

    expect(mocks.request).toHaveBeenCalledWith('/obligations/obligation-one', {
      method: 'PATCH',
      body: { categoryId: null },
    });
    expect(mocks.request).toHaveBeenCalledWith('/categories/category-one', {
      method: 'PATCH',
      body: { nameEn: 'Renamed' },
    });
  });

  it('uses only the documented session list and revoke endpoints', async () => {
    await listSessions();
    await revokeSession('session-one');
    expect(mocks.request.mock.calls).toEqual([
      ['/auth/sessions', { signal: undefined }],
      ['/auth/sessions/session-one', { method: 'DELETE' }],
    ]);
  });
});
