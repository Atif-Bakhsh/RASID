import { toMinor } from '../../common/money';

export interface Insight {
  rule:
    | 'NO_DATA'
    | 'SPENDING_ABOVE_INCOME'
    | 'SPENDING_INCREASE'
    | 'BUDGET_NEAR_LIMIT'
    | 'BUDGET_EXCEEDED';
  version: 1;
  severity: 'info' | 'warning';
  titleAr: string;
  titleEn: string;
  explanationAr: string;
  explanationEn: string;
  facts: Record<string, string | number>;
}
interface Facts {
  income: string;
  spending: string;
  previousSpending: string;
  transactionCount: number;
  budgets: { id: string; limitAmount: string; spent: string }[];
}

export function evaluateInsights(facts: Facts): Insight[] {
  const insights: Insight[] = [];
  const add = (
    rule: Insight['rule'],
    severity: Insight['severity'],
    titleAr: string,
    titleEn: string,
    explanationAr: string,
    explanationEn: string,
    evidence: Insight['facts'],
  ) =>
    insights.push({
      rule,
      version: 1,
      severity,
      titleAr,
      titleEn,
      explanationAr,
      explanationEn,
      facts: evidence,
    });
  if (!facts.transactionCount)
    add(
      'NO_DATA',
      'info',
      'ابدأ ببيانات تجريبية',
      'Add demo records',
      'لا توجد عمليات في الشهر والعملة المحددين.',
      'There are no records in this month and currency.',
      { transactionCount: 0 },
    );
  if (toMinor(facts.spending) > toMinor(facts.income))
    add(
      'SPENDING_ABOVE_INCOME',
      'warning',
      'المصروفات تتجاوز الدخل المسجل',
      'Spending exceeds recorded income',
      'مجموع المصروفات المسجلة أكبر من الدخل المسجل لهذا الشهر. قد تكون البيانات غير مكتملة.',
      'Recorded expenses exceed recorded income this month. The data may be incomplete.',
      { income: facts.income, spending: facts.spending },
    );
  if (
    toMinor(facts.previousSpending) > 0n &&
    toMinor(facts.spending) * 100n >= toMinor(facts.previousSpending) * 120n
  ) {
    add(
      'SPENDING_INCREASE',
      'info',
      'ارتفاع المصروفات المسجلة',
      'Recorded spending increased',
      'المصروفات المسجلة أعلى بنسبة 20٪ أو أكثر من الشهر السابق. الشهر الحالي قد يكون غير مكتمل.',
      'Recorded spending is at least 20% above the previous month. The current month may be incomplete.',
      {
        spending: facts.spending,
        previousSpending: facts.previousSpending,
        thresholdPercent: 20,
      },
    );
  }
  for (const budget of facts.budgets) {
    if (toMinor(budget.spent) > toMinor(budget.limitAmount))
      add(
        'BUDGET_EXCEEDED',
        'warning',
        'تجاوز الميزانية',
        'Budget exceeded',
        'مصروفات التصنيف تتجاوز الحد الذي حددته.',
        'Category expenses exceed the limit you set.',
        {
          budgetId: budget.id,
          spent: budget.spent,
          limitAmount: budget.limitAmount,
        },
      );
    else if (toMinor(budget.spent) * 100n >= toMinor(budget.limitAmount) * 80n)
      add(
        'BUDGET_NEAR_LIMIT',
        'info',
        'اقتراب من حد الميزانية',
        'Budget nearing its limit',
        'مصروفات التصنيف بلغت 80٪ على الأقل من الحد الذي حددته.',
        'Category expenses have reached at least 80% of the limit you set.',
        {
          budgetId: budget.id,
          spent: budget.spent,
          limitAmount: budget.limitAmount,
          thresholdPercent: 80,
        },
      );
  }
  return insights;
}
