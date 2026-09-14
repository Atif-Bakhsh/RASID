'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@/features/overview/format';
import type { Currency, Direction } from '@/lib/api/contracts';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { createTransaction, deleteTransaction, updateTransaction } from './api';
import { transactionPatch } from './helpers';
import { ledgerMessages } from './messages';
import { ledgerQueries } from './queries';
import { TransactionForm } from './transaction-form';
import type {
  CreateTransactionInput,
  TransactionFilters,
  TransactionRecord,
} from './types';
import { ApiErrorNotice, LedgerDialog, Pagination } from './ui';

const initialFilters: TransactionFilters = {
  page: 1,
  limit: 20,
  accountId: '',
  categoryId: '',
  direction: '',
  currency: '',
  from: '',
  to: '',
  search: '',
  orderBy: 'postedAt',
  order: 'DESC',
};

export function TransactionsPage() {
  const { locale } = useLocale();
  const t = ledgerMessages[locale];
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<TransactionRecord | 'new' | null>(
    null,
  );
  const [deleting, setDeleting] = useState<TransactionRecord | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const timeout = window.setTimeout(
      () =>
        setFilters((current) =>
          current.search === search.trim()
            ? current
            : { ...current, page: 1, search: search.trim() },
        ),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);
  const list = useQuery(ledgerQueries.transactions(userId, filters));
  const accounts = useQuery(ledgerQueries.accountDictionary(userId));
  const categories = useQuery(ledgerQueries.categories(userId));
  const accountMap = useMemo(
    () => new Map(accounts.data?.map((item) => [item.id, item]) ?? []),
    [accounts.data],
  );
  const categoryMap = useMemo(
    () => new Map(categories.data?.map((item) => [item.id, item]) ?? []),
    [categories.data],
  );
  const invalidRange =
    !!filters.from && !!filters.to && filters.from > filters.to;
  const setFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) => setFilters((current) => ({ ...current, page: 1, [key]: value }));
  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
      queryClient.invalidateQueries({ queryKey: ['analytics', userId] }),
      queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
      queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
    ]);
  }
  async function save(input: CreateTransactionInput) {
    if (editing === 'new') await createTransaction(input);
    else if (editing)
      await updateTransaction(editing.id, transactionPatch(editing, input));
    setNotice(t.transactionSaved);
    setEditing(null);
    await invalidate();
  }
  const remove = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      setNotice(t.transactionDeleted);
      setDeleting(null);
      if (list.data?.data.length === 1 && filters.page > 1)
        setFilters((current) => ({ ...current, page: current.page - 1 }));
      await invalidate();
    },
  });
  const accountName = (id: string) => accountMap.get(id)?.name ?? id;
  const categoryName = (id: string | null) =>
    !id
      ? t.uncategorized
      : ((locale === 'ar'
          ? categoryMap.get(id)?.nameAr
          : categoryMap.get(id)?.nameEn) ?? id);
  const sourceName = (source: TransactionRecord['source']) =>
    source === 'MANUAL' ? t.manual : source === 'CSV' ? t.csv : t.synthetic;
  return (
    <div className="ledger-page">
      <header className="ledger-page-heading">
        <div>
          <span className="eyebrow">RASID / {t.transactionsTitle}</span>
          <h1>{t.transactionsTitle}</h1>
          <p>{t.transactionsSubtitle}</p>
        </div>
        <button
          className="button button--primary"
          type="button"
          disabled={
            accounts.isPending ||
            categories.isPending ||
            accounts.isError ||
            categories.isError ||
            !accounts.data?.length
          }
          onClick={() => {
            setNotice('');
            setEditing('new');
          }}
        >
          <Plus size={18} aria-hidden="true" />
          {t.addTransaction}
        </button>
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
      {(accounts.isError || categories.isError) && (
        <div className="ledger-state ledger-dictionary-error">
          <ApiErrorNotice
            error={(accounts.error ?? categories.error)!}
            locale={locale}
          />
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              void accounts.refetch();
              void categories.refetch();
            }}
          >
            {t.retry}
          </button>
        </div>
      )}
      {accounts.isSuccess && !accounts.data.length && (
        <p className="ledger-state ledger-account-prerequisite" role="status">
          {t.createFirstAccount}
        </p>
      )}
      <section className="transaction-filters" aria-labelledby="filters-title">
        <div className="ledger-panel-heading">
          <h2 id="filters-title">{t.filters}</h2>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setSearch('');
              setFilters(initialFilters);
            }}
          >
            {t.resetFilters}
          </button>
        </div>
        <div className="filter-grid">
          <label>
            <span>{t.account}</span>
            <select
              value={filters.accountId}
              disabled={!accounts.data}
              onChange={(event) => setFilter('accountId', event.target.value)}
            >
              <option value="">{t.allAccounts}</option>
              {accounts.data?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} — {account.currency}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.category}</span>
            <select
              value={filters.categoryId}
              disabled={!categories.data}
              onChange={(event) => setFilter('categoryId', event.target.value)}
            >
              <option value="">{t.allCategories}</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === 'ar' ? category.nameAr : category.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.direction}</span>
            <select
              value={filters.direction}
              onChange={(event) =>
                setFilter('direction', event.target.value as '' | Direction)
              }
            >
              <option value="">{t.allDirections}</option>
              <option value="INCOME">{t.income}</option>
              <option value="EXPENSE">{t.expense}</option>
            </select>
          </label>
          <label>
            <span>{t.currency}</span>
            <select
              dir="ltr"
              value={filters.currency}
              onChange={(event) =>
                setFilter('currency', event.target.value as '' | Currency)
              }
            >
              <option value="">{t.allCurrencies}</option>
              {(['SAR', 'USD', 'EUR'] as const).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.from}</span>
            <input
              type="date"
              dir="ltr"
              min="2000-01-01"
              max="2099-12-31"
              value={filters.from}
              onChange={(event) => setFilter('from', event.target.value)}
              aria-invalid={invalidRange}
            />
          </label>
          <label>
            <span>{t.to}</span>
            <input
              type="date"
              dir="ltr"
              min="2000-01-01"
              max="2099-12-31"
              value={filters.to}
              onChange={(event) => setFilter('to', event.target.value)}
              aria-invalid={invalidRange}
            />
          </label>
          <label className="search-filter">
            <span>{t.search}</span>
            <span className="input-with-icon">
              <Search size={16} aria-hidden="true" />
              <input
                value={search}
                maxLength={80}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.searchHint}
              />
            </span>
          </label>
          <label>
            <span>{t.orderBy}</span>
            <select
              value={filters.orderBy}
              onChange={(event) =>
                setFilter(
                  'orderBy',
                  event.target.value as TransactionFilters['orderBy'],
                )
              }
            >
              <option value="postedAt">{t.newest}</option>
              <option value="amount">{t.amount}</option>
              <option value="createdAt">{t.created}</option>
            </select>
          </label>
          <label>
            <span>{t.order}</span>
            <select
              value={filters.order}
              onChange={(event) =>
                setFilter('order', event.target.value as 'ASC' | 'DESC')
              }
            >
              <option value="DESC">{t.descending}</option>
              <option value="ASC">{t.ascending}</option>
            </select>
          </label>
        </div>
        {invalidRange && (
          <p className="field-error" role="alert">
            {t.invalidRange}
          </p>
        )}
      </section>
      <section className="ledger-panel" aria-label={t.transactionsTitle}>
        {invalidRange ? null : list.isPending ||
          accounts.isPending ||
          categories.isPending ? (
          <p className="ledger-state" role="status">
            {t.transactionsLoading}
          </p>
        ) : list.isError ? (
          <div className="ledger-state">
            <ApiErrorNotice error={list.error} locale={locale} />
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void list.refetch()}
            >
              {t.retry}
            </button>
          </div>
        ) : accounts.isError || categories.isError ? (
          <p className="ledger-state" role="alert">
            {t.dictionaryError}
          </p>
        ) : !list.data.data.length ? (
          <p className="ledger-state">{t.noTransactions}</p>
        ) : (
          <>
            <div
              className="overview-table-wrap transaction-table-wrap"
              role="region"
              aria-label={t.transactionsTitle}
              tabIndex={0}
            >
              <table className="overview-table transaction-table">
                <thead>
                  <tr>
                    <th scope="col">{t.postedAt}</th>
                    <th scope="col">{t.merchant}</th>
                    <th scope="col">{t.account}</th>
                    <th scope="col">{t.category}</th>
                    <th scope="col">{t.direction}</th>
                    <th scope="col">{t.amount}</th>
                    <th scope="col">{t.source}</th>
                    <th scope="col">
                      <span className="sr-only">{t.status}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.data.map((record) => {
                    const account = accountMap.get(record.accountId);
                    return (
                      <tr key={record.id}>
                        <td>
                          <time dir="ltr">{record.postedAt}</time>
                        </td>
                        <th scope="row">
                          <strong>{record.merchant}</strong>
                          {record.reference && (
                            <small dir="ltr">{record.reference}</small>
                          )}
                        </th>
                        <td>
                          <span>{accountName(record.accountId)}</span>
                          <small dir="ltr">{account?.currency ?? ''}</small>
                        </td>
                        <td>{categoryName(record.categoryId)}</td>
                        <td>
                          <span
                            className={`direction-mark direction-mark--${record.direction.toLowerCase()}`}
                          >
                            {record.direction === 'INCOME'
                              ? t.income
                              : t.expense}
                          </span>
                        </td>
                        <td>
                          <span className="money" dir="ltr">
                            {formatMoney(record.amount)}{' '}
                            <small>{account?.currency ?? ''}</small>
                          </span>
                        </td>
                        <td>{sourceName(record.source)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              type="button"
                              aria-label={`${t.edit}: ${record.merchant}`}
                              onClick={() => setEditing(record)}
                            >
                              <Pencil size={17} aria-hidden="true" />
                            </button>
                            <button
                              className="icon-button icon-button--danger"
                              type="button"
                              aria-label={`${t.delete}: ${record.merchant}`}
                              onClick={() => {
                                remove.reset();
                                setDeleting(record);
                              }}
                            >
                              <Trash2 size={17} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={list.data.meta.page}
              totalPages={list.data.meta.totalPages}
              total={list.data.meta.total}
              onPage={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        )}
      </section>
      {editing && accounts.data && categories.data && (
        <LedgerDialog
          title={editing === 'new' ? t.addTransaction : t.editTransaction}
          closeLabel={t.close}
          onClose={() => setEditing(null)}
        >
          <TransactionForm
            transaction={editing === 'new' ? undefined : editing}
            accounts={accounts.data}
            categories={categories.data}
            onCancel={() => setEditing(null)}
            onSubmit={save}
          />
        </LedgerDialog>
      )}
      {deleting && (
        <LedgerDialog
          title={t.deleteTransactionTitle}
          closeLabel={t.close}
          onClose={() => setDeleting(null)}
        >
          <div className="delete-confirm">
            <p>{t.deleteTransactionConfirm}</p>
            <strong>{deleting.merchant}</strong>
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
                onClick={() => remove.mutate(deleting.id)}
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
