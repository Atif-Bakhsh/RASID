import { Currency } from '../../common/query.dto';
import { buildAnalystFacts, validateAnalystDraft } from './analyst-facts';

const source = {
  monthly: {
    month: '2026-09',
    currency: Currency.SAR,
    income: '1000.00',
    spending: '250.00',
    net: '750.00',
    transactionCount: 2,
    categories: [
      {
        nameAr: 'طعام',
        nameEn: 'Food',
        spending: '250.00',
        transactionCount: 2,
      },
    ],
    comparison: {
      previousMonth: '2026-08',
      income: '800.00',
      spending: '200.00',
      transactionCount: 2,
      spendingChange: '50.00',
      spendingChangePercent: 25,
    },
    obligations: { total: '100.00' },
  },
  budgets: {
    data: [
      {
        nameAr: 'طعام',
        nameEn: 'Food',
        limitAmount: '300.00',
        spent: '250.00',
        remaining: '50.00',
        utilizationPercent: 83.33,
      },
    ],
  },
  rules: [],
};

describe('AI analyst evidence boundary', () => {
  const facts = buildAnalystFacts(source);

  it('builds aggregate facts without raw account or merchant data', () => {
    expect(facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'monthly.spending',
          value: '250.00',
          unit: 'SAR',
        }),
        expect.objectContaining({
          id: 'budget.0.utilization',
          value: 83.33,
          unit: 'PERCENT',
        }),
      ]),
    );
    expect(JSON.stringify(facts)).not.toMatch(/merchant|account|email/i);
  });

  it('caps high-cardinality facts and prioritizes budget utilization', () => {
    const many = Array.from({ length: 10 }, (_, index) => ({
      nameAr: `تصنيف ${index}`,
      nameEn: `Category ${index}`,
      spending: `${index}.00`,
      transactionCount: index,
    }));
    const bounded = buildAnalystFacts({
      ...source,
      monthly: { ...source.monthly, categories: many },
      budgets: {
        data: many.map((category, index) => ({
          ...category,
          limitAmount: '100.00',
          spent: `${index}.00`,
          remaining: `${100 - index}.00`,
          utilizationPercent: index,
        })),
      },
    });
    expect(bounded.some((fact) => fact.id === 'category.8.spending')).toBe(
      false,
    );
    expect(
      bounded.find((fact) => fact.id === 'budget.0.utilization'),
    ).toMatchObject({ value: 9 });
    expect(bounded.some((fact) => fact.id === 'budget.8.utilization')).toBe(
      false,
    );
  });

  it('accepts cited numbers that exactly match trusted evidence', () => {
    expect(
      validateAnalystDraft(
        {
          status: 'ANSWERED',
          answer: 'Recorded spending is 250.00 SAR.',
          evidenceIds: ['monthly.spending'],
        },
        facts,
      ),
    ).toEqual({
      status: 'ANSWERED',
      answer: 'Recorded spending is 250.00 SAR.',
      evidenceIds: ['monthly.spending'],
    });
  });

  it.each([
    'Recorded spending is 250 SAR.',
    'Recorded spending is 250.0 SAR.',
    'الإنفاق المسجل هو ٢٥٠ ريال.',
  ])('accepts equivalent formatting of a cited decimal value: %s', (answer) => {
    expect(
      validateAnalystDraft(
        {
          status: 'ANSWERED',
          answer,
          evidenceIds: ['monthly.spending'],
        },
        facts,
      ).status,
    ).toBe('ANSWERED');
  });

  it('accepts the absolute magnitude of a cited negative change', () => {
    const factsWithDecrease = [
      ...facts,
      {
        id: 'comparison.decrease',
        labelAr: 'انخفاض الإنفاق',
        labelEn: 'Spending decrease',
        value: '-653.00',
        unit: Currency.SAR,
      } as const,
    ];
    expect(
      validateAnalystDraft(
        {
          status: 'ANSWERED',
          answer: 'Spending decreased by 653 SAR.',
          evidenceIds: ['comparison.decrease'],
        },
        factsWithDecrease,
      ).status,
    ).toBe('ANSWERED');
  });

  it('accepts a trusted catalogue number omitted from the evidence list', () => {
    expect(
      validateAnalystDraft(
        {
          status: 'ANSWERED',
          answer: 'Spending changed by 50 SAR.',
          evidenceIds: ['monthly.spending'],
        },
        facts,
      ).evidenceIds,
    ).toEqual(['monthly.spending']);
  });

  it.each([
    {
      status: 'ANSWERED',
      answer: 'Spending is 999.00 SAR.',
      evidenceIds: ['monthly.spending'],
    },
    {
      status: 'ANSWERED',
      answer: 'Spending is recorded.',
      evidenceIds: ['unknown.fact'],
    },
    { status: 'ANSWERED', answer: 'Spending is recorded.', evidenceIds: [] },
    {
      status: 'ANSWERED',
      answer: 'الإنفاق هو ٩٩٩٫٠٠ SAR.',
      evidenceIds: ['monthly.spending'],
    },
  ])('rejects unsupported output %#', (draft) => {
    expect(() => validateAnalystDraft(draft, facts)).toThrow();
  });

  it('allows a bounded out-of-scope response without invented evidence', () => {
    expect(
      validateAnalystDraft(
        {
          status: 'OUT_OF_SCOPE',
          answer: 'I can only explain the supplied monthly records.',
          evidenceIds: [],
        },
        facts,
      ).status,
    ).toBe('OUT_OF_SCOPE');
  });
});
