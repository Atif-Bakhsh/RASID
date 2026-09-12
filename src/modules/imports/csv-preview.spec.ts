import { HttpException } from '@nestjs/common';
import { parsePreview, MAX_CSV_BYTES } from './csv-preview';
const account = '20000000-0000-4000-8000-000000000001';
const header = 'postedAt,amount,direction,merchant';
const parse = (csv: string) =>
  parsePreview(Buffer.from(csv), account, new Set());
function errorCode(run: () => unknown) {
  try {
    run();
    throw new Error('Expected rejection');
  } catch (error) {
    if (!(error instanceof HttpException)) throw error;
    return (error.getResponse() as { code: string }).code;
  }
}
describe('CSV boundaries and preview', () => {
  it('supports Arabic, UTF-8 BOM, CRLF, and quoted commas', () => {
    expect(
      parse(
        `\uFEFF${header}\r\n2026-09-01,12.5,EXPENSE,"قهوة, تجريبية"\r\n`,
      )[0],
    ).toMatchObject({
      row: 2,
      status: 'ACCEPTED',
      record: { merchant: 'قهوة, تجريبية', amount: '12.50' },
    });
  });
  it('retains valid records while reporting invalid rows', () => {
    expect(
      parse(
        `${header}\n2026-02-30,10,EXPENSE,Coffee\n2026-09-01,0,EXPENSE,Zero\n2026-09-01,10,EXPENSE,Valid\nonly,two`,
      ).map((row) => row.status),
    ).toEqual(['INVALID', 'INVALID', 'ACCEPTED', 'INVALID']);
  });
  it('deduplicates normalized facts with reference disambiguation', () => {
    expect(
      parse(
        `${header},reference\n2026-09-01,10,EXPENSE,Coffee,\n2026-09-01,10.00,EXPENSE,COFFEE,\n2026-09-01,10,EXPENSE,Coffee,receipt-2`,
      ).map((row) => row.status),
    ).toEqual(['ACCEPTED', 'DUPLICATE', 'ACCEPTED']);
  });
  it.each([
    ['\n', 'CSV_HEADERS'],
    ['foo,bar\n1,2', 'CSV_HEADERS'],
    [`${header},amount\n2026-09-01,1,EXPENSE,A,1`, 'CSV_HEADERS'],
    [`${header}\n"unclosed`, 'CSV_MALFORMED'],
    [header, 'CSV_ROW_LIMIT'],
    [`${header}\n2026-09-01,1,EXPENSE,${'x'.repeat(9000)}`, 'CSV_MALFORMED'],
  ])('rejects malformed files', (csv, code) => {
    expect(errorCode(() => parse(csv))).toBe(code);
  });
  it('rejects excessive rows/bytes, binary data, and invalid UTF-8', () => {
    expect(
      errorCode(() =>
        parse(`${header}\n${'2026-09-01,1,EXPENSE,A\n'.repeat(1001)}`),
      ),
    ).toBe('CSV_ROW_LIMIT');
    expect(
      errorCode(() =>
        parsePreview(Buffer.alloc(MAX_CSV_BYTES + 1), account, new Set()),
      ),
    ).toBe('CSV_SIZE');
    expect(errorCode(() => parse(`${header}\n\0`))).toBe('CSV_ENCODING');
    expect(
      errorCode(() =>
        parsePreview(Buffer.from([0xc3, 0x28]), account, new Set()),
      ),
    ).toBe('CSV_ENCODING');
  });
  it('rejects unavailable categories without disclosing their owner', () => {
    expect(
      parse(
        `${header},categoryId\n2026-09-01,1,EXPENSE,A,10000000-0000-4000-8000-000000000001`,
      )[0].errors,
    ).toEqual(['CATEGORY_NOT_AVAILABLE']);
  });
});
