import { fromMinor, money, toMinor, MONEY_PATTERN } from './money';
import { isCalendarDate } from './validation';
import { monthRange, previousMonth } from './query.dto';
describe('Exact money and booking dates', () => {
  it('preserves fractions, signs, and large values', () => {
    expect(fromMinor(toMinor('0.10') + toMinor('0.20'))).toBe('0.30');
    expect(fromMinor(toMinor('999999999999.99') + 1n)).toBe('1000000000000.00');
    expect(money('12.5')).toBe('12.50');
    expect(fromMinor(-5n)).toBe('-0.05');
  });
  it.each(['-1', '1e3', '1.234', '01.50', 'NaN', '1,000.00', '1000000000000'])(
    'rejects unsupported amount %s',
    (value) => {
      expect(MONEY_PATTERN.test(value)).toBe(false);
    },
  );
  it('validates actual dates and leap-year/month boundaries', () => {
    expect(isCalendarDate('2024-02-29')).toBe(true);
    for (const date of ['2026-02-29', '2026-04-31', '2026-13-01'])
      expect(isCalendarDate(date)).toBe(false);
    expect(monthRange('2026-12')).toEqual({
      month: '2026-12',
      start: '2026-12-01',
      end: '2027-01-01',
    });
    expect(previousMonth('2026-01')).toBe('2025-12');
  });
});
