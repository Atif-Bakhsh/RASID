'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatMoney } from '@/features/overview/format';
import { ledgerQueries } from '@/features/ledger/queries';
import { ApiErrorNotice, LedgerDialog, Pagination } from '@/features/ledger/ui';
import type { Currency } from '@/lib/api/contracts';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import {
  createBudget,
  createObligation,
  deleteBudget,
  deleteObligation,
  updateBudget,
  updateObligation,
} from './api';
import { BudgetForm, ObligationForm } from './forms';
import { obligationPatch } from './helpers';
import { managementMessages } from './messages';
import { managementQueries } from './queries';
import type {
  BudgetUsage,
  CreateBudgetInput,
  ObligationInput,
  ObligationRecord,
} from './types';

type EditState =
  | { kind: 'budget'; record?: BudgetUsage }
  | { kind: 'obligation'; record?: ObligationRecord };
type DeleteState = { kind: 'budget' | 'obligation'; id: string; name: string };

export function BudgetsPage() {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currency, setCurrency] = useState<Currency>('SAR');
  const [obligationPage, setObligationPage] = useState(1);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<DeleteState | null>(null);
  const [notice, setNotice] = useState('');
  const budgets = useQuery(managementQueries.budgets(userId, month, currency));
  const obligations = useQuery(
    managementQueries.obligations(userId, obligationPage),
  );
  const categories = useQuery(ledgerQueries.categories(userId));
  const categoryMap = useMemo(
    () => new Map(categories.data?.map((item) => [item.id, item]) ?? []),
    [categories.data],
  );
  const invalidateBudgets = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
      queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
    ]);
  const invalidateObligations = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['obligations', userId] }),
      queryClient.invalidateQueries({ queryKey: ['analytics', userId] }),
      queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
    ]);
  const remove = useMutation({
    mutationFn: async (target: DeleteState) =>
      target.kind === 'budget'
        ? deleteBudget(target.id)
        : deleteObligation(target.id),
    onSuccess: async (_value, target) => {
      setNotice(
        target.kind === 'budget' ? t.budgetDeleted : t.obligationDeleted,
      );
      setDeleting(null);
      if (
        target.kind === 'obligation' &&
        obligations.data?.data.length === 1 &&
        obligationPage > 1
      )
        setObligationPage(obligationPage - 1);
      await (target.kind === 'budget'
        ? invalidateBudgets()
        : invalidateObligations());
    },
  });
  async function saveBudget(input: CreateBudgetInput) {
    if (editing?.kind === 'budget' && editing.record)
      await updateBudget(editing.record.id, input.limitAmount);
    else await createBudget(input);
    setNotice(t.budgetSaved);
    setEditing(null);
    await invalidateBudgets();
  }
  async function saveObligation(input: ObligationInput) {
    if (editing?.kind === 'obligation' && editing.record)
      await updateObligation(
        editing.record.id,
        obligationPatch(editing.record, input),
      );
    else await createObligation(input);
    setNotice(t.obligationSaved);
    setEditing(null);
    await invalidateObligations();
  }
  const categoryName = (id: string | null) => {
    if (!id) return t.uncategorized;
    const item = categoryMap.get(id);
    return (locale === 'ar' ? item?.nameAr : item?.nameEn) ?? id;
  };
  return (
    <div className="management-page">
      <header className="ledger-page-heading">
        <div>
          <span className="eyebrow">RASID / LIMITS</span>
          <h1>{t.budgetsTitle}</h1>
          <p>{t.budgetsSubtitle}</p>
        </div>
      </header>
      {notice && (
        <p className="success-notice" role="status">
          {notice}
          <button
            type="button"
            aria-label={t.dismiss}
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </p>
      )}
      <section className="management-section" aria-labelledby="budgets-title">
        <header className="management-section-header">
          <div>
            <h2 id="budgets-title">{t.budgetSection}</h2>
            <p>{t.exactCategory}</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            disabled={!categories.data?.length}
            onClick={() => {
              setNotice('');
              setEditing({ kind: 'budget' });
            }}
          >
            <Plus size={18} aria-hidden="true" />
            {t.addBudget}
          </button>
        </header>
        <div className="management-filters">
          <label>
            <span>{t.month}</span>
            <input
              type="month"
              dir="ltr"
              min="2000-01"
              max="2099-12"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <label>
            <span>{t.currency}</span>
            <select
              dir="ltr"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              {(['SAR', 'USD', 'EUR'] as const).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        {budgets.isPending ? (
          <p className="ledger-state" role="status">
            {t.budgetsLoading}
          </p>
        ) : budgets.isError ? (
          <StateError
            error={budgets.error}
            retry={() => void budgets.refetch()}
          />
        ) : !budgets.data.data.length ? (
          <p className="ledger-state">{t.budgetsEmpty}</p>
        ) : (
          <div className="budget-ledger">
            {budgets.data.data.map((budget) => (
              <article
                className={
                  budget.isExceeded ? 'budget-line is-exceeded' : 'budget-line'
                }
                key={budget.id}
              >
                <div className="budget-line-heading">
                  <div>
                    <strong>
                      {locale === 'ar' ? budget.nameAr : budget.nameEn}
                    </strong>
                    <span>
                      {budget.isExceeded ? t.exceeded : t.withinLimit}
                    </span>
                  </div>
                  <div className="row-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        setEditing({ kind: 'budget', record: budget })
                      }
                    >
                      <Pencil size={15} aria-hidden="true" />
                      {t.editBudget}
                    </button>
                    <button
                      className="text-button text-button--danger"
                      type="button"
                      onClick={() => {
                        remove.reset();
                        setDeleting({
                          kind: 'budget',
                          id: budget.id,
                          name: locale === 'ar' ? budget.nameAr : budget.nameEn,
                        });
                      }}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {t.delete}
                    </button>
                  </div>
                </div>
                <div className="budget-track" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.max(0, Math.min(100, budget.utilizationPercent))}%`,
                    }}
                  />
                </div>
                <dl className="budget-facts">
                  <Fact
                    label={t.limit}
                    value={`${formatMoney(budget.limitAmount)} ${budget.currency}`}
                  />
                  <Fact
                    label={t.spent}
                    value={`${formatMoney(budget.spent)} ${budget.currency}`}
                  />
                  <Fact
                    label={t.remaining}
                    value={`${formatMoney(budget.remaining)} ${budget.currency}`}
                    bad={budget.remaining.startsWith('-')}
                  />
                  <Fact
                    label={t.utilization}
                    value={`${budget.utilizationPercent}%`}
                    bad={budget.isExceeded}
                  />
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
      <section
        className="management-section"
        aria-labelledby="obligations-title"
      >
        <header className="management-section-header">
          <div>
            <h2 id="obligations-title">{t.obligationsSection}</h2>
            <p>{t.obligationMeaning}</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setNotice('');
              setEditing({ kind: 'obligation' });
            }}
          >
            <Plus size={18} aria-hidden="true" />
            {t.addObligation}
          </button>
        </header>
        {obligations.isPending ? (
          <p className="ledger-state" role="status">
            {t.obligationsLoading}
          </p>
        ) : obligations.isError ? (
          <StateError
            error={obligations.error}
            retry={() => void obligations.refetch()}
          />
        ) : !obligations.data.data.length ? (
          <p className="ledger-state">{t.obligationsEmpty}</p>
        ) : (
          <>
            <div className="obligation-list-management">
              {obligations.data.data.map((item) => (
                <article
                  className={
                    item.isActive
                      ? 'obligation-row'
                      : 'obligation-row is-inactive'
                  }
                  key={item.id}
                >
                  <div className="obligation-date">
                    <CalendarClock size={18} aria-hidden="true" />
                    <span>{t.dueDay}</span>
                    <strong dir="ltr">{item.dueDay}</strong>
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {categoryName(item.categoryId)} ·{' '}
                      {item.isActive ? t.active : t.inactive}
                    </span>
                  </div>
                  <strong className="money" dir="ltr">
                    {formatMoney(item.amount)} <small>{item.currency}</small>
                  </strong>
                  <div className="row-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        setEditing({ kind: 'obligation', record: item })
                      }
                    >
                      {t.edit}
                    </button>
                    <button
                      className="text-button text-button--danger"
                      type="button"
                      onClick={() => {
                        remove.reset();
                        setDeleting({
                          kind: 'obligation',
                          id: item.id,
                          name: item.name,
                        });
                      }}
                    >
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination
              page={obligations.data.meta.page}
              totalPages={obligations.data.meta.totalPages}
              total={obligations.data.meta.total}
              onPage={setObligationPage}
            />
          </>
        )}
      </section>
      {editing?.kind === 'budget' && (
        <LedgerDialog
          title={editing.record ? t.editBudget : t.addBudget}
          closeLabel={t.close}
          onClose={() => setEditing(null)}
        >
          <BudgetForm
            budget={editing.record}
            month={month}
            currency={currency}
            categories={categories.data ?? []}
            onCancel={() => setEditing(null)}
            onSubmit={saveBudget}
          />
        </LedgerDialog>
      )}
      {editing?.kind === 'obligation' && (
        <LedgerDialog
          title={editing.record ? t.editObligation : t.addObligation}
          closeLabel={t.close}
          onClose={() => setEditing(null)}
        >
          <ObligationForm
            obligation={editing.record}
            categories={categories.data ?? []}
            onCancel={() => setEditing(null)}
            onSubmit={saveObligation}
          />
        </LedgerDialog>
      )}
      {deleting && (
        <LedgerDialog
          title={t.deleteTitle}
          closeLabel={t.close}
          onClose={() => setDeleting(null)}
        >
          <div className="delete-confirm">
            <p>
              {deleting.kind === 'budget'
                ? t.deleteBudgetConfirm
                : t.deleteObligationConfirm}
            </p>
            <strong>{deleting.name}</strong>
            {remove.isError && (
              <ApiErrorNotice error={remove.error} locale={locale} />
            )}
            <footer className="ledger-form-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setDeleting(null)}
              >
                {t.cancel}
              </button>
              <button
                className="button button--danger"
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleting)}
              >
                {remove.isPending ? t.deleting : t.confirmDelete}
              </button>
            </footer>
          </div>
        </LedgerDialog>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  bad,
}: {
  label: string;
  value: string;
  bad?: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={bad ? 'financial-negative' : ''} dir="ltr">
        {value}
      </dd>
    </div>
  );
}

function StateError({ error, retry }: { error: Error; retry: () => void }) {
  const { locale } = useLocale();
  const t = managementMessages[locale];
  return (
    <div className="ledger-state">
      <ApiErrorNotice error={error} locale={locale} />
      <button
        className="button button--secondary"
        type="button"
        onClick={retry}
      >
        {t.retry}
      </button>
    </div>
  );
}
