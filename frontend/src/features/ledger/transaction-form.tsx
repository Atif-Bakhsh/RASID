'use client';

import { useState, type FormEvent } from 'react';
import type { Direction } from '@/lib/api/contracts';
import { ApiClientError } from '@/lib/api/errors';
import { useLocale } from '@/providers/locale-provider';
import { isCalendarDate, isPositiveMoney, transactionPatch } from './helpers';
import { ledgerMessages } from './messages';
import type {
  AccountRecord,
  CategoryRecord,
  CreateTransactionInput,
  TransactionRecord,
} from './types';
import { ApiErrorNotice } from './ui';

export function TransactionForm({
  transaction,
  accounts,
  categories,
  onCancel,
  onSubmit,
}: {
  transaction?: TransactionRecord;
  accounts: AccountRecord[];
  categories: CategoryRecord[];
  onCancel: () => void;
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
}) {
  const { locale } = useLocale();
  const t = ledgerMessages[locale];
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? accounts[0]?.id ?? '',
  );
  const [postedAt, setPostedAt] = useState(transaction?.postedAt ?? '');
  const [amount, setAmount] = useState(transaction?.amount ?? '');
  const [direction, setDirection] = useState<Direction>(
    transaction?.direction ?? 'EXPENSE',
  );
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '');
  const [reference, setReference] = useState(transaction?.reference ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    const next: Record<string, string> = {};
    if (!accountId) next.accountId = t.selectAccount;
    if (!isCalendarDate(postedAt)) next.postedAt = t.invalidDate;
    if (!isPositiveMoney(amount)) next.amount = t.positiveMoney;
    const cleanMerchant = merchant.trim();
    if (!cleanMerchant || cleanMerchant.length > 160)
      next.merchant = t.merchantLength;
    const cleanReference = reference.trim();
    if (cleanReference.length > 100) next.reference = t.referenceLength;
    const input: CreateTransactionInput = {
      accountId,
      postedAt,
      amount,
      direction,
      merchant: cleanMerchant,
      ...(categoryId
        ? { categoryId }
        : transaction
          ? { categoryId: null }
          : {}),
      ...(cleanReference
        ? { reference: cleanReference }
        : transaction
          ? { reference: null }
          : {}),
    };
    if (
      transaction &&
      !Object.keys(transactionPatch(transaction, input)).length
    )
      next.form = t.noChanges;
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error : new Error('request failed'),
      );
    } finally {
      setPending(false);
    }
  }
  const duplicate =
    requestError instanceof ApiClientError &&
    requestError.status === 409 &&
    requestError.code === 'DUPLICATE_TRANSACTION';
  return (
    <form
      className="ledger-form"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {requestError && (
        <ApiErrorNotice
          error={requestError}
          locale={locale}
          conflictMessage={duplicate ? t.duplicateTransaction : undefined}
        />
      )}
      {errors.form && (
        <p className="form-summary-error" role="alert">
          {errors.form}
        </p>
      )}
      {!accounts.length ? (
        <p className="form-summary-error" role="alert">
          {t.createFirstAccount}
        </p>
      ) : (
        <div className="ledger-form-grid">
          <label className="ledger-form-wide">
            <span>{t.account}</span>
            <select
              name="accountId"
              value={accountId}
              disabled={!!transaction}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} — {account.currency}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <small className="field-error">{errors.accountId}</small>
            )}
          </label>
          <label>
            <span>{t.postedAt}</span>
            <input
              type="date"
              name="postedAt"
              dir="ltr"
              min="2000-01-01"
              max="2099-12-31"
              value={postedAt}
              onChange={(event) => setPostedAt(event.target.value)}
              aria-invalid={!!errors.postedAt}
            />
            {errors.postedAt && (
              <small className="field-error">{errors.postedAt}</small>
            )}
          </label>
          <label>
            <span>{t.amount}</span>
            <input
              name="amount"
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <small className="field-error">{errors.amount}</small>
            )}
          </label>
          <label>
            <span>{t.direction}</span>
            <select
              name="direction"
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as Direction)
              }
            >
              <option value="EXPENSE">{t.expense}</option>
              <option value="INCOME">{t.income}</option>
            </select>
          </label>
          <label>
            <span>{t.category}</span>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{t.uncategorized}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === 'ar' ? category.nameAr : category.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="ledger-form-wide">
            <span>{t.merchant}</span>
            <input
              name="merchant"
              value={merchant}
              maxLength={160}
              onChange={(event) => setMerchant(event.target.value)}
              aria-invalid={!!errors.merchant}
            />
            {errors.merchant && (
              <small className="field-error">{errors.merchant}</small>
            )}
          </label>
          <label className="ledger-form-wide">
            <span>{t.reference}</span>
            <input
              name="reference"
              dir="ltr"
              aria-label={t.reference}
              value={reference}
              maxLength={100}
              onChange={(event) => setReference(event.target.value)}
              aria-describedby="reference-hint"
              aria-invalid={!!errors.reference}
            />
            <small id="reference-hint">{t.referenceHint}</small>
            {errors.reference && (
              <small className="field-error">{errors.reference}</small>
            )}
          </label>
        </div>
      )}
      {transaction && (
        <p className="form-contract-note">{t.transactionCurrencyNote}</p>
      )}
      <footer className="ledger-form-actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={onCancel}
        >
          {t.cancel}
        </button>
        <button
          className="button button--primary"
          type="submit"
          disabled={pending || !accounts.length}
        >
          {pending ? t.saving : t.save}
        </button>
      </footer>
    </form>
  );
}
