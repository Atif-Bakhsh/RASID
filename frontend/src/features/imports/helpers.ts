import type { Locale } from '@/lib/api/contracts';
import { importMessages } from './messages';

export const MAX_CSV_BYTES = 512 * 1024;

export function validateCsvFile(file: File | null, locale: Locale) {
  const t = importMessages[locale];
  if (!file) return t.fileRequired;
  if (!/\.csv$/i.test(file.name)) return t.fileTypeError;
  if (!file.size) return t.fileEmptyError;
  if (file.size > MAX_CSV_BYTES) return t.fileSizeError;
  return null;
}

export function formatRowError(error: string, locale: Locale) {
  const t = importMessages[locale];
  const exact: Record<string, string> = {
    COLUMN_COUNT: t.rowColumnCount,
    AMOUNT_MUST_BE_POSITIVE: t.rowPositiveAmount,
    CATEGORY_NOT_AVAILABLE: t.rowCategoryUnavailable,
    DUPLICATE_IN_FILE: t.rowDuplicateFile,
    DUPLICATE_IN_ACCOUNT: t.rowDuplicateAccount,
  };
  if (exact[error]) return exact[error];
  const field = error.split(':', 1)[0];
  const fieldMessages: Record<string, string> = {
    postedAt: t.rowInvalidDate,
    amount: t.rowInvalidAmount,
    direction: t.rowInvalidDirection,
    merchant: t.rowInvalidMerchant,
    categoryId: t.rowInvalidCategory,
    reference: t.rowInvalidReference,
  };
  return fieldMessages[field] ?? error;
}
