'use client';

import { useId, useState, type FormEvent } from 'react';
import { ApiErrorNotice } from '@/features/ledger/ui';
import type { Currency } from '@/lib/api/contracts';
import { useLocale } from '@/providers/locale-provider';
import {
  categoryPatch,
  isPositiveMoney,
  obligationPatch,
  VALID_MONTH,
} from './helpers';
import { managementMessages } from './messages';
import type {
  BudgetUsage,
  CategoryInput,
  CategoryRecord,
  CreateBudgetInput,
  ObligationInput,
  ObligationRecord,
} from './types';

function Actions({
  pending,
  onCancel,
}: {
  pending: boolean;
  onCancel: () => void;
}) {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  return (
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
  );
}

export function BudgetForm({
  budget,
  month: initialMonth,
  currency: initialCurrency,
  categories,
  onCancel,
  onSubmit,
}: {
  budget?: BudgetUsage;
  month: string;
  currency: Currency;
  categories: CategoryRecord[];
  onCancel: () => void;
  onSubmit: (input: CreateBudgetInput) => Promise<void>;
}) {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  const fieldId = useId();
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '');
  const [month, setMonth] = useState(budget?.month ?? initialMonth);
  const [currency, setCurrency] = useState<Currency>(
    budget?.currency ?? initialCurrency,
  );
  const [limitAmount, setLimitAmount] = useState(budget?.limitAmount ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    const next: Record<string, string> = {};
    if (!categoryId) next.categoryId = t.selectCategory;
    if (!VALID_MONTH.test(month)) next.month = t.invalidMonth;
    if (!isPositiveMoney(limitAmount)) next.limitAmount = t.positiveMoney;
    if (budget && limitAmount === budget.limitAmount) next.form = t.noChanges;
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      await onSubmit({ categoryId, month, currency, limitAmount });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error : new Error(t.requestFailed),
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
      {requestError && (
        <ApiErrorNotice
          error={requestError}
          locale={locale}
          conflictMessage={t.budgetConflict}
        />
      )}
      {errors.form && (
        <p className="form-summary-error" role="alert">
          {errors.form}
        </p>
      )}
      <div className="ledger-form-grid">
        <label className="ledger-form-wide">
          <span>{t.category}</span>
          <select
            aria-label={t.category}
            value={categoryId}
            disabled={!!budget}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-invalid={!!errors.categoryId}
            aria-describedby={
              errors.categoryId ? `${fieldId}-category-error` : undefined
            }
          >
            <option value="">{t.selectCategory}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {locale === 'ar' ? category.nameAr : category.nameEn}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <small id={`${fieldId}-category-error`} className="field-error">
              {errors.categoryId}
            </small>
          )}
        </label>
        <label>
          <span>{t.month}</span>
          <input
            aria-label={t.month}
            type="month"
            dir="ltr"
            value={month}
            disabled={!!budget}
            min="2000-01"
            max="2099-12"
            onChange={(event) => setMonth(event.target.value)}
            aria-invalid={!!errors.month}
            aria-describedby={
              errors.month ? `${fieldId}-month-error` : undefined
            }
          />
          {errors.month && (
            <small id={`${fieldId}-month-error`} className="field-error">
              {errors.month}
            </small>
          )}
        </label>
        <label>
          <span>{t.currency}</span>
          <select
            dir="ltr"
            value={currency}
            disabled={!!budget}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {(['SAR', 'USD', 'EUR'] as const).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="ledger-form-wide">
          <span>{t.limit}</span>
          <input
            aria-label={t.limit}
            dir="ltr"
            inputMode="decimal"
            value={limitAmount}
            onChange={(event) => setLimitAmount(event.target.value)}
            aria-invalid={!!errors.limitAmount}
            aria-describedby={
              errors.limitAmount ? `${fieldId}-limit-error` : undefined
            }
          />
          {errors.limitAmount && (
            <small id={`${fieldId}-limit-error`} className="field-error">
              {errors.limitAmount}
            </small>
          )}
        </label>
      </div>
      <p className="form-contract-note">{t.exactCategory}</p>
      <Actions pending={pending} onCancel={onCancel} />
    </form>
  );
}

export function ObligationForm({
  obligation,
  categories,
  onCancel,
  onSubmit,
}: {
  obligation?: ObligationRecord;
  categories: CategoryRecord[];
  onCancel: () => void;
  onSubmit: (input: ObligationInput) => Promise<void>;
}) {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  const fieldId = useId();
  const [name, setName] = useState(obligation?.name ?? '');
  const [amount, setAmount] = useState(obligation?.amount ?? '');
  const [currency, setCurrency] = useState<Currency>(
    obligation?.currency ?? 'SAR',
  );
  const [dueDay, setDueDay] = useState(String(obligation?.dueDay ?? 1));
  const [categoryId, setCategoryId] = useState(obligation?.categoryId ?? '');
  const [isActive, setIsActive] = useState(obligation?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    const cleanName = name.trim();
    const numericDueDay = Number(dueDay);
    const next: Record<string, string> = {};
    if (!cleanName || cleanName.length > 100) next.name = t.nameRequired;
    if (!isPositiveMoney(amount)) next.amount = t.positiveMoney;
    if (
      !Number.isInteger(numericDueDay) ||
      numericDueDay < 1 ||
      numericDueDay > 28
    )
      next.dueDay = t.dueDayError;
    const input: ObligationInput = {
      name: cleanName,
      amount,
      currency,
      dueDay: numericDueDay,
      categoryId: categoryId || null,
      isActive,
    };
    if (obligation && !Object.keys(obligationPatch(obligation, input)).length)
      next.form = t.noChanges;
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error : new Error(t.requestFailed),
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
        <label className="ledger-form-wide">
          <span>{t.obligationName}</span>
          <input
            aria-label={t.obligationName}
            value={name}
            maxLength={100}
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
          <span>{t.amount}</span>
          <input
            aria-label={t.amount}
            dir="ltr"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={!!errors.amount}
            aria-describedby={
              errors.amount ? `${fieldId}-amount-error` : undefined
            }
          />
          {errors.amount && (
            <small id={`${fieldId}-amount-error`} className="field-error">
              {errors.amount}
            </small>
          )}
        </label>
        <label>
          <span>{t.currency}</span>
          <select
            dir="ltr"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            {(['SAR', 'USD', 'EUR'] as const).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t.dueDay}</span>
          <input
            aria-label={t.dueDay}
            type="number"
            dir="ltr"
            min={1}
            max={28}
            value={dueDay}
            onChange={(event) => setDueDay(event.target.value)}
            aria-invalid={!!errors.dueDay}
            aria-describedby={
              errors.dueDay ? `${fieldId}-day-error` : undefined
            }
          />
          {errors.dueDay && (
            <small id={`${fieldId}-day-error`} className="field-error">
              {errors.dueDay}
            </small>
          )}
        </label>
        <label>
          <span>{t.category}</span>
          <select
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
        <label className="management-switch">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>{isActive ? t.active : t.inactive}</span>
        </label>
      </div>
      <p className="form-contract-note">{t.obligationMeaning}</p>
      <Actions pending={pending} onCancel={onCancel} />
    </form>
  );
}

export function CategoryForm({
  category,
  categories,
  onCancel,
  onSubmit,
}: {
  category?: CategoryRecord;
  categories: CategoryRecord[];
  onCancel: () => void;
  onSubmit: (input: CategoryInput) => Promise<void>;
}) {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  const fieldId = useId();
  const [nameAr, setNameAr] = useState(category?.nameAr ?? '');
  const [nameEn, setNameEn] = useState(category?.nameEn ?? '');
  const [parentId, setParentId] = useState(category?.parentId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    const input: CategoryInput = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      ...(!category ? { parentId: parentId || null } : {}),
    };
    const next: Record<string, string> = {};
    if (!input.nameAr || input.nameAr.length > 60)
      next.nameAr = t.categoryNameError;
    if (!input.nameEn || input.nameEn.length > 60)
      next.nameEn = t.categoryNameError;
    if (category && !Object.keys(categoryPatch(category, input)).length)
      next.form = t.noChanges;
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error : new Error(t.requestFailed),
      );
    } finally {
      setPending(false);
    }
  }
  const roots = categories.filter((item) => !item.parentId);
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
          <span>{t.nameAr}</span>
          <input
            aria-label={t.nameAr}
            dir="rtl"
            value={nameAr}
            maxLength={60}
            onChange={(event) => setNameAr(event.target.value)}
            aria-invalid={!!errors.nameAr}
            aria-describedby={
              errors.nameAr ? `${fieldId}-name-ar-error` : undefined
            }
          />
          {errors.nameAr && (
            <small id={`${fieldId}-name-ar-error`} className="field-error">
              {errors.nameAr}
            </small>
          )}
        </label>
        <label>
          <span>{t.nameEn}</span>
          <input
            aria-label={t.nameEn}
            dir="ltr"
            value={nameEn}
            maxLength={60}
            onChange={(event) => setNameEn(event.target.value)}
            aria-invalid={!!errors.nameEn}
            aria-describedby={
              errors.nameEn ? `${fieldId}-name-en-error` : undefined
            }
          />
          {errors.nameEn && (
            <small id={`${fieldId}-name-en-error`} className="field-error">
              {errors.nameEn}
            </small>
          )}
        </label>
        {!category && (
          <label className="ledger-form-wide">
            <span>{t.parent}</span>
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">{t.rootCategory}</option>
              {roots.map((item) => (
                <option key={item.id} value={item.id}>
                  {locale === 'ar' ? item.nameAr : item.nameEn}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <Actions pending={pending} onCancel={onCancel} />
    </form>
  );
}
