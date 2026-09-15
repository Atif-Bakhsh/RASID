import type { Currency, Money, Page } from '@/lib/api/contracts';
import type { CategoryRecord } from '@/features/ledger/types';

export interface BudgetUsage {
  id: string;
  categoryId: string;
  month: string;
  currency: Currency;
  limitAmount: Money;
  nameAr: string;
  nameEn: string;
  spent: Money;
  remaining: Money;
  utilizationPercent: number;
  isExceeded: boolean;
}

export interface BudgetRecord {
  id: string;
  createdAt: string;
  userId: string;
  categoryId: string;
  month: string;
  currency: Currency;
  limitAmount: Money;
}

export interface BudgetList {
  month: string;
  currency: Currency;
  data: BudgetUsage[];
}

export interface CreateBudgetInput {
  categoryId: string;
  month: string;
  currency: Currency;
  limitAmount: Money;
}

export interface ObligationRecord {
  id: string;
  createdAt: string;
  userId: string;
  name: string;
  amount: Money;
  currency: Currency;
  dueDay: number;
  categoryId: string | null;
  isActive: boolean;
}

export interface ObligationInput {
  name: string;
  amount: Money;
  currency: Currency;
  dueDay: number;
  categoryId?: string | null;
  isActive: boolean;
}

export interface CategoryInput {
  nameAr: string;
  nameEn: string;
  parentId?: string | null;
}

export interface SessionRecord {
  id: string;
  createdAt: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
}

export type ObligationPage = Page<ObligationRecord>;
export type { CategoryRecord };
