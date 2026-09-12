import { createHash } from 'node:crypto';
import { fail } from '../../common/errors';
import { money, toMinor } from '../../common/money';
import { Direction } from '../../common/query.dto';

interface Facts {
  postedAt: string;
  amount: string;
  direction: Direction;
  merchant: string;
  reference?: string | null;
}

/** Version the normalization if this contract changes; existing hashes need a migration. */
export function fingerprint(facts: Facts): string {
  const merchant = facts.merchant
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLowerCase();
  return createHash('sha256')
    .update(
      JSON.stringify([
        'v1',
        facts.postedAt,
        money(facts.amount),
        facts.direction,
        merchant,
        facts.reference?.trim() ?? null,
      ]),
    )
    .digest('hex');
}
export function positiveAmount(amount: string): string {
  if (toMinor(amount) <= 0n)
    fail(
      400,
      'AMOUNT_MUST_BE_POSITIVE',
      'Amount must be greater than zero.',
      'يجب أن يكون المبلغ أكبر من صفر.',
    );
  return money(amount);
}
