import { Direction } from '../../common/query.dto';

export interface ImportRecord {
  postedAt: string;
  amount: string;
  direction: Direction;
  merchant: string;
  categoryId: string | null;
  reference: string | null;
  fingerprint: string;
}
export interface PreviewRow {
  row: number;
  status: 'ACCEPTED' | 'INVALID' | 'DUPLICATE';
  errors: string[];
  record?: ImportRecord;
}
export interface CommitResult {
  inserted: number;
  duplicates: number;
  invalid: number;
}
