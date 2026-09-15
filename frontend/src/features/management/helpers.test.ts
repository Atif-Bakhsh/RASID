import { describe, expect, it } from 'vitest';
import { categoryPatch, obligationPatch } from './helpers';

describe('management PATCH helpers', () => {
  it('preserves omitted obligation fields and emits explicit null when category is cleared', () => {
    const record = {
      id: 'one',
      createdAt: '2026-09-01T00:00:00Z',
      userId: 'user-one',
      name: 'إيجار',
      amount: '1000.00',
      currency: 'SAR' as const,
      dueDay: 1,
      categoryId: 'category-one',
      isActive: false,
    };
    expect(
      obligationPatch(record, {
        ...record,
        name: 'إيجار معدل',
        categoryId: null,
      }),
    ).toEqual({
      name: 'إيجار معدل',
      categoryId: null,
    });
  });

  it('sends only changed private category names', () => {
    const record = {
      id: 'one',
      createdAt: '2026-09-01T00:00:00Z',
      ownerUserId: 'user-one',
      nameAr: 'قهوة',
      nameEn: 'Coffee',
      parentId: null,
    };
    expect(
      categoryPatch(record, { nameAr: 'قهوة', nameEn: 'Coffee shops' }),
    ).toEqual({ nameEn: 'Coffee shops' });
  });
});
