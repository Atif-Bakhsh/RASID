import { isPositiveMoney } from '@/features/ledger/helpers';
import type {
  CategoryInput,
  CategoryRecord,
  ObligationInput,
  ObligationRecord,
} from './types';

export const VALID_MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;
export { isPositiveMoney };

export function obligationPatch(
  record: ObligationRecord,
  input: ObligationInput,
) {
  const patch: Partial<ObligationInput> = {};
  const name = input.name.trim();
  if (name !== record.name) patch.name = name;
  if (input.amount !== record.amount) patch.amount = input.amount;
  if (input.currency !== record.currency) patch.currency = input.currency;
  if (input.dueDay !== record.dueDay) patch.dueDay = input.dueDay;
  const categoryId = input.categoryId ?? null;
  if (categoryId !== record.categoryId) patch.categoryId = categoryId;
  if (input.isActive !== record.isActive) patch.isActive = input.isActive;
  return patch;
}

export function categoryPatch(record: CategoryRecord, input: CategoryInput) {
  const patch: Partial<Pick<CategoryInput, 'nameAr' | 'nameEn'>> = {};
  const nameAr = input.nameAr.trim();
  const nameEn = input.nameEn.trim();
  if (nameAr !== record.nameAr) patch.nameAr = nameAr;
  if (nameEn !== record.nameEn) patch.nameEn = nameEn;
  return patch;
}
