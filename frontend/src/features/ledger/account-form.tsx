'use client';

import { useId, useState, type FormEvent } from 'react';
import type { Currency } from '@/lib/api/contracts';
import { useLocale } from '@/providers/locale-provider';
import { accountPatch, OFFSET_TIMESTAMP, SIGNED_MONEY } from './helpers';
import { ledgerMessages } from './messages';
import type { AccountRecord, AccountType, CreateAccountInput } from './types';
import { ApiErrorNotice } from './ui';

export function AccountForm({
  account,
  onCancel,
  onSubmit,
}: {
  account?: AccountRecord;
  onCancel: () => void;
  onSubmit: (input: CreateAccountInput) => Promise<void>;
}) {
  const { locale } = useLocale();
  const t = ledgerMessages[locale];
  const fieldId = useId();
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'CURRENT');
  const [currency, setCurrency] = useState<Currency>(
    account?.currency ?? 'SAR',
  );
  const [balance, setBalance] = useState(account?.balance ?? '0.00');
  const [balanceAsOf, setBalanceAsOf] = useState(
    account?.balanceAsOf ?? new Date().toISOString(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    const next: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 80) next.name = t.nameLength;
    if (!SIGNED_MONEY.test(balance)) next.balance = t.invalidMoney;
    if (
      !OFFSET_TIMESTAMP.test(balanceAsOf) ||
      Number.isNaN(Date.parse(balanceAsOf))
    )
      next.balanceAsOf = t.invalidTimestamp;
    const input = { name: trimmedName, type, currency, balance, balanceAsOf };
    if (account && !Object.keys(accountPatch(account, input)).length)
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

  return (
    <form
      className="ledger-form"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {requestError && <ApiErrorNotice error={requestError} locale={locale} />}
      {errors.form && (
        <p className="form-summary-error" role="alert">
          {errors.form}
        </p>
      )}
      <div className="ledger-form-grid">
        <label>
          <span>{t.accountName}</span>
          <input
            aria-label={t.accountName}
            name="name"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
          />
          {errors.name && (
            <small id={`${fieldId}-name-error`} className="field-error">
              {errors.name}
            </small>
          )}
        </label>
        <label>
          <span>{t.accountType}</span>
          <select
            name="type"
            value={type}
            disabled={!!account}
            onChange={(event) => setType(event.target.value as AccountType)}
          >
            <option value="CURRENT">{t.current}</option>
            <option value="SAVINGS">{t.savings}</option>
            <option value="CASH">{t.cash}</option>
          </select>
        </label>
        <label>
          <span>{t.currency}</span>
          <select
            name="currency"
            dir="ltr"
            value={currency}
            disabled={!!account}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {(['SAR', 'USD', 'EUR'] as const).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t.balance}</span>
          <input
            aria-label={t.balance}
            name="balance"
            dir="ltr"
            inputMode="decimal"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            aria-invalid={!!errors.balance}
            aria-describedby={
              errors.balance ? `${fieldId}-balance-error` : undefined
            }
          />
          {errors.balance && (
            <small id={`${fieldId}-balance-error`} className="field-error">
              {errors.balance}
            </small>
          )}
        </label>
        <label className="ledger-form-wide">
          <span>{t.balanceAsOf}</span>
          <input
            aria-label={t.balanceAsOf}
            name="balanceAsOf"
            dir="ltr"
            value={balanceAsOf}
            onChange={(event) => setBalanceAsOf(event.target.value)}
            aria-describedby={
              errors.balanceAsOf
                ? `balance-as-of-hint ${fieldId}-balance-as-of-error`
                : 'balance-as-of-hint'
            }
            aria-invalid={!!errors.balanceAsOf}
          />
          <small id="balance-as-of-hint">{t.timestampHint}</small>
          {errors.balanceAsOf && (
            <small
              id={`${fieldId}-balance-as-of-error`}
              className="field-error"
            >
              {errors.balanceAsOf}
            </small>
          )}
        </label>
      </div>
      {account && <p className="form-contract-note">{t.immutableAccount}</p>}
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
          disabled={pending}
        >
          {pending ? t.saving : t.save}
        </button>
      </footer>
    </form>
  );
}
