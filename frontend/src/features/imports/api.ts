import { protectedApiRequest } from '@/lib/api/client';
import { ApiNetworkError } from '@/lib/api/errors';
import type {
  CommitImportInput,
  ImportDetail,
  ImportPage,
  PreviewImportInput,
} from './types';

export const listImports = (page: number, limit = 20, signal?: AbortSignal) =>
  protectedApiRequest<ImportPage>(`/imports?page=${page}&limit=${limit}`, {
    signal,
  });

export const getImport = (id: string, signal?: AbortSignal) =>
  protectedApiRequest<ImportDetail>(`/imports/${id}`, { signal });

export function previewImport({ accountId, file }: PreviewImportInput) {
  const body = new FormData();
  body.append('file', file);
  return protectedApiRequest<ImportDetail>(
    `/imports/accounts/${accountId}/preview`,
    { method: 'POST', body },
  );
}

export const commitImport = ({
  importId,
  acknowledgeRejectedRows,
}: CommitImportInput) =>
  protectedApiRequest<ImportDetail>(`/imports/${importId}/commit`, {
    method: 'POST',
    body: acknowledgeRejectedRows ? { acknowledgeRejectedRows: true } : {},
  });

export class ImportCommitUncertainError extends Error {
  readonly importId: string;

  constructor(importId: string, options?: ErrorOptions) {
    super('The commit result could not be confirmed.', options);
    this.name = 'ImportCommitUncertainError';
    this.importId = importId;
  }
}

function isNetworkError(error: unknown): error is ApiNetworkError {
  return (
    error instanceof ApiNetworkError ||
    (error instanceof Error && error.name === 'ApiNetworkError')
  );
}

/**
 * A lost commit response is reconciled against the same persisted import. A
 * PREVIEW status is retried once with the same ID; no upload or new ID occurs.
 */
export async function commitImportWithRecovery(input: CommitImportInput) {
  try {
    return await commitImport(input);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
  }

  let current: ImportDetail;
  try {
    current = await getImport(input.importId);
  } catch (error) {
    if (isNetworkError(error))
      throw new ImportCommitUncertainError(input.importId);
    throw error;
  }

  if (current.status === 'COMMITTED') return current;

  try {
    return await commitImport(input);
  } catch (error) {
    if (isNetworkError(error))
      throw new ImportCommitUncertainError(input.importId);
    throw error;
  }
}
