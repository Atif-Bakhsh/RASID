import type { Currency } from '../../common/query.dto';
import type { Insight } from './insight-rules';

export type AnalystStatus = 'ANSWERED' | 'INSUFFICIENT_DATA' | 'OUT_OF_SCOPE';
export type FactUnit = Currency | 'PERCENT' | 'COUNT' | 'MONTH' | 'RULE';

export interface AnalystFact {
  id: string;
  labelAr: string;
  labelEn: string;
  value: string | number;
  unit: FactUnit;
}

interface AnalystSource {
  monthly: {
    month: string;
    currency: Currency;
    income: string;
    spending: string;
    net: string;
    transactionCount: number;
    categories: Array<{
      nameAr: string;
      nameEn: string;
      spending: string;
      transactionCount: number;
    }>;
    comparison: {
      previousMonth: string;
      income: string;
      spending: string;
      transactionCount: number;
      spendingChange: string;
      spendingChangePercent: number | null;
    };
    obligations: { total: string };
  };
  budgets: {
    data: Array<{
      nameAr: string;
      nameEn: string;
      limitAmount: string;
      spent: string;
      remaining: string;
      utilizationPercent: number;
    }>;
  };
  rules: Insight[];
}

export function buildAnalystFacts(source: AnalystSource): AnalystFact[] {
  const { monthly } = source;
  const money = monthly.currency;
  const facts: AnalystFact[] = [
    {
      id: 'period.month',
      labelAr: 'الشهر المحدد',
      labelEn: 'Selected month',
      value: monthly.month,
      unit: 'MONTH',
    },
    {
      id: 'monthly.income',
      labelAr: 'الدخل المسجل',
      labelEn: 'Recorded income',
      value: monthly.income,
      unit: money,
    },
    {
      id: 'monthly.spending',
      labelAr: 'الإنفاق المسجل',
      labelEn: 'Recorded spending',
      value: monthly.spending,
      unit: money,
    },
    {
      id: 'monthly.net',
      labelAr: 'صافي الشهر',
      labelEn: 'Monthly net',
      value: monthly.net,
      unit: money,
    },
    {
      id: 'monthly.transaction_count',
      labelAr: 'عدد المعاملات',
      labelEn: 'Transaction count',
      value: monthly.transactionCount,
      unit: 'COUNT',
    },
    {
      id: 'comparison.previous_month',
      labelAr: 'الشهر السابق',
      labelEn: 'Previous month',
      value: monthly.comparison.previousMonth,
      unit: 'MONTH',
    },
    {
      id: 'comparison.previous_spending',
      labelAr: 'إنفاق الشهر السابق',
      labelEn: 'Previous-month spending',
      value: monthly.comparison.spending,
      unit: money,
    },
    {
      id: 'comparison.spending_change',
      labelAr: 'التغير في الإنفاق',
      labelEn: 'Spending change',
      value: monthly.comparison.spendingChange,
      unit: money,
    },
    {
      id: 'obligations.estimated_total',
      labelAr: 'إجمالي تقديرات الالتزامات المتكررة',
      labelEn: 'Recurring-obligation estimate total',
      value: monthly.obligations.total,
      unit: money,
    },
  ];
  if (monthly.comparison.spendingChangePercent !== null)
    facts.push({
      id: 'comparison.spending_change_percent',
      labelAr: 'نسبة تغير الإنفاق',
      labelEn: 'Spending change percentage',
      value: monthly.comparison.spendingChangePercent,
      unit: 'PERCENT',
    });
  monthly.categories.slice(0, 8).forEach((category, index) => {
    facts.push(
      {
        id: `category.${index}.spending`,
        labelAr: `إنفاق تصنيف ${category.nameAr}`,
        labelEn: `${category.nameEn} spending`,
        value: category.spending,
        unit: money,
      },
      {
        id: `category.${index}.transaction_count`,
        labelAr: `عدد معاملات تصنيف ${category.nameAr}`,
        labelEn: `${category.nameEn} transaction count`,
        value: category.transactionCount,
        unit: 'COUNT',
      },
    );
  });
  [...source.budgets.data]
    .sort((left, right) => right.utilizationPercent - left.utilizationPercent)
    .slice(0, 8)
    .forEach((budget, index) => {
      const prefix = `budget.${index}`;
      facts.push(
        {
          id: `${prefix}.limit`,
          labelAr: `حد ميزانية ${budget.nameAr}`,
          labelEn: `${budget.nameEn} budget limit`,
          value: budget.limitAmount,
          unit: money,
        },
        {
          id: `${prefix}.spent`,
          labelAr: `المنفق من ميزانية ${budget.nameAr}`,
          labelEn: `${budget.nameEn} budget spending`,
          value: budget.spent,
          unit: money,
        },
        {
          id: `${prefix}.remaining`,
          labelAr: `المتبقي من ميزانية ${budget.nameAr}`,
          labelEn: `${budget.nameEn} budget remaining`,
          value: budget.remaining,
          unit: money,
        },
        {
          id: `${prefix}.utilization`,
          labelAr: `نسبة استخدام ميزانية ${budget.nameAr}`,
          labelEn: `${budget.nameEn} budget utilization`,
          value: budget.utilizationPercent,
          unit: 'PERCENT',
        },
      );
    });
  source.rules.slice(0, 8).forEach((rule, index) =>
    facts.push({
      id: `observation.${index}`,
      labelAr: rule.titleAr,
      labelEn: rule.titleEn,
      value: rule.rule,
      unit: 'RULE',
    }),
  );
  return facts;
}

export interface AnalystDraft {
  status: AnalystStatus;
  answer: string;
  evidenceIds: string[];
}

const numberTokens = (value: string) => {
  const western = value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replaceAll('٬', ',')
    .replaceAll('٫', '.');
  return (
    western.match(/[+-]?\d[\d,]*(?:\.\d+)?/g)?.map((item) => {
      const normalized = item.replaceAll(',', '').replace(/^\+/, '');
      const negative = normalized.startsWith('-');
      const unsigned = negative ? normalized.slice(1) : normalized;
      const [wholePart, decimalPart = ''] = unsigned.split('.');
      const whole = wholePart.replace(/^0+(?=\d)/, '') || '0';
      const decimal = decimalPart.replace(/0+$/, '');
      const magnitude = decimal ? `${whole}.${decimal}` : whole;
      return negative && magnitude !== '0' ? `-${magnitude}` : magnitude;
    }) ?? []
  );
};

export function validateAnalystDraft(
  value: unknown,
  facts: AnalystFact[],
): AnalystDraft {
  if (!value || typeof value !== 'object') throw new Error('Invalid AI output');
  const draft = value as Record<string, unknown>;
  if (
    !['ANSWERED', 'INSUFFICIENT_DATA', 'OUT_OF_SCOPE'].includes(
      String(draft.status),
    ) ||
    typeof draft.answer !== 'string' ||
    !draft.answer.trim() ||
    draft.answer.length > 900 ||
    !Array.isArray(draft.evidenceIds) ||
    draft.evidenceIds.length > 8 ||
    !draft.evidenceIds.every((id) => typeof id === 'string')
  )
    throw new Error('Invalid AI output');
  const evidenceIds = [...new Set(draft.evidenceIds)];
  if (draft.status === 'ANSWERED' && !evidenceIds.length)
    throw new Error('Answered output requires evidence');
  const byId = new Map(facts.map((fact) => [fact.id, fact]));
  if (evidenceIds.some((id) => !byId.has(id)))
    throw new Error('AI cited unknown evidence');
  const factNumbers = (fact: AnalystFact) =>
    numberTokens(String(fact.value)).flatMap((number) =>
      number.startsWith('-') ? [number, number.slice(1)] : [number],
    );
  const allowedNumbers = new Set(facts.flatMap(factNumbers));
  const unsupportedNumber = numberTokens(draft.answer).find(
    (number) => !allowedNumbers.has(number),
  );
  if (unsupportedNumber)
    throw new Error(
      `AI answer contains an unsupported number: ${unsupportedNumber}`,
    );
  return {
    status: draft.status as AnalystStatus,
    answer: draft.answer.trim(),
    evidenceIds,
  };
}
