import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { fail } from '../../common/errors';
import { toMinor, money } from '../../common/money';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { fingerprint } from '../transactions/transaction-facts';
import { PreviewRow } from './import.types';

export const MAX_CSV_BYTES = 512 * 1024;
export const MAX_CSV_ROWS = 1000;
const required = ['postedAt', 'amount', 'direction', 'merchant'];
const optional = ['categoryId', 'reference'];

export function parsePreview(
  bytes: Buffer,
  accountId: string,
  visibleCategoryIds: Set<string>,
): PreviewRow[] {
  if (bytes.length === 0 || bytes.length > MAX_CSV_BYTES)
    fail(
      400,
      'CSV_SIZE',
      'Upload a non-empty CSV up to 512 KiB.',
      'ارفع ملف CSV غير فارغ بحجم لا يتجاوز 512 كيلوبايت.',
    );
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail(
      400,
      'CSV_ENCODING',
      'CSV must be UTF-8 encoded.',
      'يجب أن يكون ترميز الملف UTF-8.',
    );
  }
  if (source.includes('\0'))
    fail(
      400,
      'CSV_ENCODING',
      'CSV contains binary data.',
      'يحتوي الملف على بيانات غير نصية.',
    );
  let records: string[][];
  try {
    records = parse(source, {
      bom: true,
      trim: true,
      skip_empty_lines: true,
      max_record_size: 8192,
      relax_column_count: true,
    });
  } catch {
    fail(
      400,
      'CSV_MALFORMED',
      'CSV quoting or record size is invalid.',
      'تنسيق CSV أو حجم السجل غير صالح.',
    );
  }
  const header = records.shift();
  if (
    !header ||
    new Set(header).size !== header.length ||
    required.some((key) => !header.includes(key)) ||
    header.some((key) => ![...required, ...optional].includes(key))
  ) {
    fail(
      400,
      'CSV_HEADERS',
      `Required columns: ${required.join(',')}; optional: ${optional.join(',')}.`,
      'أسماء أعمدة CSV مفقودة أو غير صالحة.',
    );
  }
  if (!records.length || records.length > MAX_CSV_ROWS)
    fail(
      400,
      'CSV_ROW_LIMIT',
      'CSV must have 1 to 1000 data records.',
      'يجب أن يحتوي الملف على 1 إلى 1000 سجل.',
    );
  const seen = new Set<string>();
  return records.map((cells, index) => {
    // Record ordinal, including the header. Quoted multi-line cells remain one record.
    const row = index + 2;
    if (cells.length !== header.length)
      return { row, status: 'INVALID', errors: ['COLUMN_COUNT'] };
    const values: Record<string, string | null> = Object.fromEntries(
      header.map((key, i) => [key, cells[i]]),
    );
    if (!values.categoryId) values.categoryId = null;
    if (!values.reference) values.reference = null;
    const dto = plainToInstance(CreateTransactionDto, { ...values, accountId });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    }).map(
      (error) =>
        `${error.property}: ${Object.values(error.constraints ?? {}).join('; ')}`,
    );
    if (errors.length) return { row, status: 'INVALID', errors };
    if (toMinor(dto.amount) <= 0n)
      return { row, status: 'INVALID', errors: ['AMOUNT_MUST_BE_POSITIVE'] };
    if (dto.categoryId && !visibleCategoryIds.has(dto.categoryId))
      return { row, status: 'INVALID', errors: ['CATEGORY_NOT_AVAILABLE'] };
    const record = {
      postedAt: dto.postedAt,
      amount: money(dto.amount),
      direction: dto.direction,
      merchant: dto.merchant,
      categoryId: dto.categoryId ?? null,
      reference: dto.reference ?? null,
      fingerprint: fingerprint(dto),
    };
    if (seen.has(record.fingerprint))
      return {
        row,
        status: 'DUPLICATE',
        errors: ['DUPLICATE_IN_FILE'],
        record,
      };
    seen.add(record.fingerprint);
    return { row, status: 'ACCEPTED', errors: [], record };
  });
}
