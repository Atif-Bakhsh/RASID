import type {
  AccountRecord,
  CreateAccountInput,
  CreateTransactionInput,
  TransactionRecord,
  UpdateAccountInput,
  UpdateTransactionInput,
} from './types';

export const SIGNED_MONEY = /^-?(0|[1-9]\d{0,11})(\.\d{1,2})?$/;
export const POSITIVE_MONEY = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;
export const OFFSET_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/;
export const CALENDAR_DATE = /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isPositiveMoney(value: string) {
  return POSITIVE_MONEY.test(value) && !/^0(?:\.0{1,2})?$/.test(value);
}

export function isCalendarDate(value: string) {
  if (!CALENDAR_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

export function accountPatch(
  account: AccountRecord,
  input: CreateAccountInput,
): UpdateAccountInput {
  const patch: UpdateAccountInput = {};
  const name = input.name.trim();
  if (name !== account.name) patch.name = name;
  if (
    input.balance !== account.balance ||
    input.balanceAsOf !== account.balanceAsOf
  ) {
    patch.balance = input.balance;
    patch.balanceAsOf = input.balanceAsOf;
  }
  return patch;
}

export function transactionPatch(
  record: TransactionRecord,
  input: CreateTransactionInput,
): UpdateTransactionInput {
  const patch: UpdateTransactionInput = {};
  if (input.postedAt !== record.postedAt) patch.postedAt = input.postedAt;
  if (input.amount !== record.amount) patch.amount = input.amount;
  if (input.direction !== record.direction) patch.direction = input.direction;
  const merchant = input.merchant.trim();
  if (merchant !== record.merchant) patch.merchant = merchant;
  const categoryId = input.categoryId ?? null;
  if (categoryId !== record.categoryId) patch.categoryId = categoryId;
  const reference = input.reference?.trim() || null;
  if (reference !== record.reference) patch.reference = reference;
  return patch;
}
