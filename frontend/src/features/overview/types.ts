import type { Currency, Money } from '@/lib/api/contracts';

export interface MonthScope {
  month: string;
  currency: Currency;
}
export interface MonthlyAnalytics extends MonthScope {
  income: Money;
  spending: Money;
  net: Money;
  transactionCount: number;
  dataMode: string;
  categories: {
    categoryId: string | null;
    nameAr: string;
    nameEn: string;
    spending: Money;
    transactionCount: number;
  }[];
  comparison: {
    previousMonth: string;
    income: Money;
    spending: Money;
    transactionCount: number;
    spendingChange: Money;
    spendingChangePercent: number | null;
  };
  obligations: {
    total: Money;
    interpretation: 'RECURRING_ESTIMATE_NOT_ADDITIONAL_SPENDING';
    items: {
      id: string;
      name: string;
      amount: Money;
      currency: Currency;
      dueDay: number;
      dueDate: string;
      isActive: boolean;
      categoryId: string | null;
    }[];
  };
}
export interface Budgets extends MonthScope {
  data: {
    id: string;
    categoryId: string;
    nameAr: string;
    nameEn: string;
    month: string;
    currency: Currency;
    limitAmount: Money;
    spent: Money;
    remaining: Money;
    utilizationPercent: number;
    isExceeded: boolean;
  }[];
}
export interface Insights extends MonthScope {
  dataMode: string;
  disclaimerAr: string;
  disclaimerEn: string;
  data: {
    rule:
      | 'NO_DATA'
      | 'SPENDING_ABOVE_INCOME'
      | 'SPENDING_INCREASE'
      | 'BUDGET_NEAR_LIMIT'
      | 'BUDGET_EXCEEDED';
    version: number;
    severity: 'info' | 'warning';
    titleAr: string;
    titleEn: string;
    explanationAr: string;
    explanationEn: string;
    facts: Record<string, string | number>;
  }[];
}
