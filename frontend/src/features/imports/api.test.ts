import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiNetworkError } from '@/lib/api/errors';
import {
  commitImport,
  commitImportWithRecovery,
  ImportCommitUncertainError,
  previewImport,
} from './api';
import type { ImportDetail } from './types';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ protectedApiRequest: mocks.request }));

const preview: ImportDetail = {
  id: 'import-one',
  createdAt: '2026-09-13T10:00:00Z',
  userId: 'user-one',
  accountId: 'account-one',
  filename: 'synthetic.csv',
  contentHash: 'hash',
  status: 'PREVIEW',
  committedAt: null,
  result: null,
  summary: { total: 1, accepted: 1, duplicates: 0, invalid: 0 },
  rows: [],
};
const committed: ImportDetail = {
  ...preview,
  status: 'COMMITTED',
  committedAt: '2026-09-13T10:01:00Z',
  result: { inserted: 1, duplicates: 0, invalid: 0 },
};

beforeEach(() => mocks.request.mockReset());

describe('CSV import API', () => {
  it('sends exactly one multipart file and leaves the Content-Type boundary to the browser', async () => {
    mocks.request.mockResolvedValue(preview);
    const file = new File(['postedAt,amount,direction,merchant'], 'demo.csv', {
      type: 'text/csv',
    });
    await previewImport({ accountId: 'account-one', file });
    const [path, options] = mocks.request.mock.calls[0];
    expect(path).toBe('/imports/accounts/account-one/preview');
    expect(options.method).toBe('POST');
    expect(options.headers).toBeUndefined();
    expect(options.body).toBeInstanceOf(FormData);
    expect(Array.from((options.body as FormData).entries())).toEqual([
      ['file', file],
    ]);
  });

  it('checks status after a lost commit response and retries the same import ID when still PREVIEW', async () => {
    mocks.request
      .mockRejectedValueOnce(new ApiNetworkError())
      .mockResolvedValueOnce(preview)
      .mockResolvedValueOnce(committed);
    await expect(
      commitImportWithRecovery({
        importId: preview.id,
        acknowledgeRejectedRows: false,
      }),
    ).resolves.toEqual(committed);
    expect(mocks.request.mock.calls.map(([path]) => path)).toEqual([
      '/imports/import-one/commit',
      '/imports/import-one',
      '/imports/import-one/commit',
    ]);
  });

  it('returns the stored result without another commit when status recovery finds COMMITTED', async () => {
    mocks.request
      .mockRejectedValueOnce(new ApiNetworkError())
      .mockResolvedValueOnce(committed);
    await expect(
      commitImportWithRecovery({
        importId: preview.id,
        acknowledgeRejectedRows: true,
      }),
    ).resolves.toEqual(committed);
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it('retains the import ID when both commit and status recovery lose their responses', async () => {
    mocks.request
      .mockRejectedValueOnce(new ApiNetworkError())
      .mockRejectedValueOnce(new ApiNetworkError());
    let failure: unknown;
    try {
      await commitImportWithRecovery({
        importId: preview.id,
        acknowledgeRejectedRows: true,
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ImportCommitUncertainError);
    expect(failure).toMatchObject({ importId: preview.id });
  });

  it('repeated commits target the same ID and use the server-returned original result', async () => {
    mocks.request.mockResolvedValue(committed);
    const input = {
      importId: preview.id,
      acknowledgeRejectedRows: true,
    };
    await expect(commitImport(input)).resolves.toEqual(committed);
    await expect(commitImport(input)).resolves.toEqual(committed);
    expect(mocks.request.mock.calls).toEqual([
      [
        '/imports/import-one/commit',
        { method: 'POST', body: { acknowledgeRejectedRows: true } },
      ],
      [
        '/imports/import-one/commit',
        { method: 'POST', body: { acknowledgeRejectedRows: true } },
      ],
    ]);
  });
});
