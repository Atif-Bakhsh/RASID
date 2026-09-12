import { evaluateInsights } from './insight-rules';
const base = {
  income: '1000.00',
  spending: '100.00',
  previousSpending: '100.00',
  transactionCount: 1,
  budgets: [],
};
describe('Explainable insight rules', () => {
  it('avoids percentage claims with a zero previous period', () => {
    expect(evaluateInsights({ ...base, previousSpending: '0.00' })).toEqual([]);
  });
  it('triggers a spending increase at exactly 20 percent', () => {
    expect(evaluateInsights({ ...base, spending: '119.99' })).toEqual([]);
    expect(evaluateInsights({ ...base, spending: '120.00' })[0]).toMatchObject({
      rule: 'SPENDING_INCREASE',
      version: 1,
      facts: { thresholdPercent: 20 },
    });
  });
  it.each([
    ['79.99', undefined],
    ['80.00', 'BUDGET_NEAR_LIMIT'],
    ['100.00', 'BUDGET_NEAR_LIMIT'],
    ['100.01', 'BUDGET_EXCEEDED'],
  ])('handles budget boundary %s', (spent, rule) => {
    expect(
      evaluateInsights({
        ...base,
        budgets: [{ id: 'budget', limitAmount: '100.00', spent: spent }],
      })[0]?.rule,
    ).toBe(rule);
  });
  it('explains empty data and spending above recorded income', () => {
    expect(evaluateInsights({ ...base, transactionCount: 0 })[0].rule).toBe(
      'NO_DATA',
    );
    expect(evaluateInsights({ ...base, income: '0.00' })[0]).toMatchObject({
      rule: 'SPENDING_ABOVE_INCOME',
      facts: { income: '0.00', spending: '100.00' },
    });
  });
});
