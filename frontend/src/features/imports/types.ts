import type { Direction, Money, Page } from '@/lib/api/contracts';

export type ImportStatus = 'PREVIEW' | 'COMMITTED';
export type ImportRowStatus = 'ACCEPTED' | 'INVALID' | 'DUPLICATE';

export interface ImportCounts {
  total: number;
  accepted: number;
  duplicates: number;
  invalid: number;
}

export interface ImportResult {
  inserted: number;
  duplicates: number;
  invalid: number;
}

export interface ImportRecord {
  postedAt: string;
  amount: Money;
  direction: Direction;
  merchant: string;
  categoryId: string | null;
  reference: string | null;
  fingerprint: string;
}

export interface ImportRow {
  row: number;
  status: ImportRowStatus;
  errors: string[];
  record?: ImportRecord;
}

export interface ImportSummary {
  id: string;
  createdAt: string;
  userId: string;
  accountId: string;
  status: ImportStatus;
  filename: string;
  contentHash: string;
  committedAt: string | null;
  result: ImportResult | null;
  summary: ImportCounts;
}

export interface ImportDetail extends ImportSummary {
  rows: ImportRow[];
}

export type ImportPage = Page<ImportSummary>;

export interface PreviewImportInput {
  accountId: string;
  file: File;
}

export interface CommitImportInput {
  importId: string;
  acknowledgeRejectedRows: boolean;
}
