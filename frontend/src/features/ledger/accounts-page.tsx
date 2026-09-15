'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/features/overview/format';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { createAccount, deleteAccount, updateAccount } from './api';
import { AccountForm } from './account-form';
import { accountPatch } from './helpers';
import { ledgerMessages } from './messages';
import { ledgerQueries } from './queries';
import type { AccountRecord, CreateAccountInput } from './types';
import { ApiErrorNotice, LedgerDialog, Pagination } from './ui';

export function AccountsPage() {
  const { locale } = useLocale();
  const t = ledgerMessages[locale];
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AccountRecord | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AccountRecord | null>(null);
  const [notice, setNotice] = useState('');
  const list = useQuery(ledgerQueries.accountList(userId, page));
  const detail = useQuery(ledgerQueries.accountDetail(userId, selectedId));
  const remove = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      setNotice(t.accountDeleted);
      setDeleting(null);
      setSelectedId(null);
      if (list.data?.data.length === 1 && page > 1) setPage(page - 1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts', userId] }),
        queryClient.invalidateQueries({
          queryKey: ['account-dictionary', userId],
        }),
      ]);
    },
  });
  async function save(input: CreateAccountInput) {
    if (editing === 'new') await createAccount(input);
    else if (editing)
      await updateAccount(editing.id, accountPatch(editing, input));
    setNotice(t.accountSaved);
    setEditing(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] }),
      queryClient.invalidateQueries({
        queryKey: ['account-dictionary', userId],
      }),
    ]);
  }
  const typeLabel = (type: AccountRecord['type']) =>
    type === 'CURRENT' ? t.current : type === 'SAVINGS' ? t.savings : t.cash;
  return (
    <div className="ledger-page">
      <header className="ledger-page-heading">
        <div>
          <span className="eyebrow">RASID / {t.manualAccount}</span>
          <h1>{t.accountsTitle}</h1>
          <p>{t.accountsSubtitle}</p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => {
            setNotice('');
            setEditing('new');
          }}
        >
          <Plus size={18} aria-hidden="true" />
          {t.addAccount}
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
      <div className="ledger-master-detail">
        <section className="ledger-panel" aria-label={t.accountsTitle}>
          {list.isPending ? (
            <p className="ledger-state" role="status">
              {t.accountsLoading}
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
          ) : !list.data.data.length ? (
            <p className="ledger-state">{t.noAccounts}</p>
          ) : (
            <>
              <ul className="account-list">
                {list.data.data.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      className={
                        selectedId === account.id
                          ? 'account-row is-selected'
                          : 'account-row'
                      }
                      onClick={() => setSelectedId(account.id)}
                    >
                      <span>
                        <strong>{account.name}</strong>
                        <small>
                          {t.manualAccount} · {typeLabel(account.type)}
                        </small>
                      </span>
                      <span className="account-row-balance" dir="ltr">
                        {formatMoney(account.balance)}{' '}
                        <small>{account.currency}</small>
                      </span>
                      <time dateTime={account.balanceAsOf} dir="ltr">
                        {account.balanceAsOf}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination
                page={list.data.meta.page}
                totalPages={list.data.meta.totalPages}
                total={list.data.meta.total}
                onPage={(value) => {
                  setPage(value);
                  setSelectedId(null);
                }}
              />
            </>
          )}
        </section>
        <section
          className="ledger-panel account-detail-panel"
          aria-label={t.accountDetails}
        >
          <div className="ledger-panel-heading">
            <h2>{t.accountDetails}</h2>
          </div>
          {!selectedId ? (
            <p className="ledger-state">{t.openDetails}</p>
          ) : detail.isPending ? (
            <p className="ledger-state" role="status">
              {t.loading}
            </p>
          ) : detail.isError ? (
            <div className="ledger-state">
              <ApiErrorNotice error={detail.error} locale={locale} />
            </div>
          ) : (
            <div className="account-detail">
              <span className="ledger-stamp">{t.manualAccount}</span>
              <h3>{detail.data.name}</h3>
              <strong className="detail-balance" dir="ltr">
                {formatMoney(detail.data.balance)}{' '}
                <small>{detail.data.currency}</small>
              </strong>
              <dl>
                <div>
                  <dt>{t.balanceAsOf}</dt>
                  <dd>
                    <time dateTime={detail.data.balanceAsOf} dir="ltr">
                      {detail.data.balanceAsOf}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>{t.accountType}</dt>
                  <dd>{typeLabel(detail.data.type)}</dd>
                </div>
                <div>
                  <dt>{t.createdAt}</dt>
                  <dd>
                    <time dateTime={detail.data.createdAt} dir="ltr">
                      {detail.data.createdAt}
                    </time>
                  </dd>
                </div>
              </dl>
              <div className="detail-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setEditing(detail.data)}
                >
                  <Pencil size={16} aria-hidden="true" />
                  {t.editAccount}
                </button>
                <button
                  className="button button--danger"
                  type="button"
                  onClick={() => {
                    remove.reset();
                    setDeleting(detail.data);
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {t.deleteAccount}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {editing && (
        <LedgerDialog
          title={editing === 'new' ? t.addAccount : t.editAccount}
          closeLabel={t.close}
          onClose={() => setEditing(null)}
        >
          <AccountForm
            account={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSubmit={save}
          />
        </LedgerDialog>
      )}
      {deleting && (
        <LedgerDialog
          title={t.deleteAccountTitle}
          closeLabel={t.close}
          onClose={() => setDeleting(null)}
        >
          <div className="delete-confirm">
            <p>{t.deleteAccountConfirm}</p>
            <strong>{deleting.name}</strong>
            {remove.isError && (
              <ApiErrorNotice
                error={remove.error}
                locale={locale}
                conflictMessage={t.accountConflict}
              />
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
