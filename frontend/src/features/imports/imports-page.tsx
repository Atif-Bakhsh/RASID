'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  FileSpreadsheet,
  History,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ledgerQueries } from '@/features/ledger/queries';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import {
  commitImportWithRecovery,
  getImport,
  ImportCommitUncertainError,
  previewImport,
} from './api';
import { validateCsvFile } from './helpers';
import { ImportDetailView } from './import-detail';
import { importMessages } from './messages';
import { importQueries } from './queries';
import type { ImportDetail, ImportSummary } from './types';
import { ImportErrorNotice, ImportPagination } from './ui';

export function ImportsPage() {
  const { locale } = useLocale();
  const t = importMessages[locale];
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accountError, setAccountError] = useState('');
  const [fileError, setFileError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [notice, setNotice] = useState('');
  const history = useQuery(importQueries.list(userId, page));
  const detail = useQuery(importQueries.detail(userId, activeId));
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

  const cacheDetail = (value: ImportDetail) => {
    queryClient.setQueryData(
      importQueries.detail(userId, value.id).queryKey,
      value,
    );
    setActiveId(value.id);
  };
  const refreshHistory = () =>
    queryClient.invalidateQueries({
      queryKey: ['imports', userId, 'page'],
    });
  const preview = useMutation({
    mutationFn: previewImport,
    onSuccess: async (value) => {
      cacheDetail(value);
      setNotice(t.previewReady);
      setAcknowledged(false);
      await refreshHistory();
    },
  });
  const commit = useMutation({
    mutationFn: commitImportWithRecovery,
    onSuccess: async (value) => {
      cacheDetail(value);
      setNotice(t.commitComplete);
      await Promise.all([
        refreshHistory(),
        queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
        queryClient.invalidateQueries({ queryKey: ['analytics', userId] }),
        queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
        queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
      ]);
    },
  });
  const checkStatus = useMutation({
    mutationFn: (id: string) => getImport(id),
    onSuccess: async (value) => {
      cacheDetail(value);
      commit.reset();
      await refreshHistory();
    },
  });

  function submitPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    preview.reset();
    if (!accountId) {
      setAccountError(t.selectAccount);
      return;
    }
    setAccountError('');
    const error = validateCsvFile(file, locale);
    setFileError(error ?? '');
    if (error || !file) return;
    preview.mutate({ accountId, file });
  }

  const active = detail.data;
  const accountName = (id: string) => accountMap.get(id)?.name ?? id;
  const categoryName = (id: string | null) => {
    if (!id) return t.uncategorized;
    const category = categoryMap.get(id);
    return (locale === 'ar' ? category?.nameAr : category?.nameEn) ?? id;
  };
  const selectImport = (item: ImportSummary) => {
    setNotice('');
    preview.reset();
    commit.reset();
    checkStatus.reset();
    setAcknowledged(false);
    setActiveId(item.id);
  };
  const submitCommit = () => {
    if (!active || active.status !== 'PREVIEW') return;
    setNotice('');
    checkStatus.reset();
    commit.mutate({
      importId: active.id,
      acknowledgeRejectedRows: acknowledged,
    });
  };
  const commitUncertain = commit.error instanceof ImportCommitUncertainError;

  return (
    <div className="imports-page">
      <header className="ledger-page-heading">
        <div>
          <span className="eyebrow">RASID / CSV</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </header>

      <div className="synthetic-import-warning" role="note">
        <FileSpreadsheet size={22} aria-hidden="true" />
        <strong>{t.syntheticWarning}</strong>
      </div>

      {notice && (
        <p className="success-notice" role="status">
          {notice}
        </p>
      )}

      <div className="import-entry-grid">
        <section
          className="ledger-panel import-upload-panel"
          aria-labelledby="new-import-title"
        >
          <div className="ledger-panel-heading">
            <h2 id="new-import-title">{t.newImport}</h2>
            <UploadCloud size={21} aria-hidden="true" />
          </div>
          {accounts.isError && (
            <div className="import-inline-error">
              <ImportErrorNotice error={accounts.error} locale={locale} />
              <button
                className="button button--secondary"
                type="button"
                onClick={() => void accounts.refetch()}
              >
                {t.retry}
              </button>
            </div>
          )}
          {preview.isError && (
            <ImportErrorNotice error={preview.error} locale={locale} />
          )}
          <form
            className="import-upload-form"
            onSubmit={submitPreview}
            noValidate
          >
            <label>
              <span>{t.chooseAccount}</span>
              <select
                value={accountId}
                disabled={accounts.isPending || accounts.isError}
                aria-invalid={!!accountError}
                aria-describedby={
                  accountError ? 'csv-account-error' : undefined
                }
                onChange={(event) => {
                  setAccountId(event.target.value);
                  setAccountError('');
                }}
              >
                <option value="">{t.selectAccount}</option>
                {accounts.data?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {account.currency}
                  </option>
                ))}
              </select>
            </label>
            {accountError && (
              <p className="field-error" id="csv-account-error" role="alert">
                {accountError}
              </p>
            )}
            <label>
              <span>{t.chooseFile}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setFileError('');
                }}
                aria-invalid={!!fileError}
                aria-describedby={fileError ? 'csv-file-error' : undefined}
              />
            </label>
            {accounts.isPending && (
              <p className="form-contract-note" role="status">
                {t.accountsLoading}
              </p>
            )}
            {accounts.isSuccess && !accounts.data.length && (
              <p className="form-summary-error" role="alert">
                {t.noAccounts}
              </p>
            )}
            {fileError && (
              <p className="field-error" id="csv-file-error" role="alert">
                {fileError}
              </p>
            )}
            <button
              className="button button--primary"
              type="submit"
              disabled={
                preview.isPending ||
                accounts.isPending ||
                accounts.isError ||
                !accounts.data?.length
              }
            >
              {preview.isPending ? t.previewing : t.preview}
            </button>
          </form>
        </section>

        <aside
          className="ledger-panel import-rules"
          aria-labelledby="import-rules-title"
        >
          <div className="ledger-panel-heading">
            <h2 id="import-rules-title">{t.importRules}</h2>
          </div>
          <ol>
            <li>{t.sizeRule}</li>
            <li>{t.rowRule}</li>
            <li>{t.encodingRule}</li>
          </ol>
          <p>
            {t.requiredHeaders}:{' '}
            <code dir="ltr">postedAt,amount,direction,merchant</code>
            <br />
            {t.optionalHeaders}: <code dir="ltr">categoryId,reference</code>
          </p>
          <p>{t.repeatedUpload}</p>
          <div className="example-downloads" aria-label={t.examplesTitle}>
            <strong>{t.examplesTitle}</strong>
            <a href="/examples/synthetic-transactions.csv" download>
              <ArrowDownToLine size={16} aria-hidden="true" />
              {t.validExample}
            </a>
            <a href="/examples/synthetic-row-errors.csv" download>
              <ArrowDownToLine size={16} aria-hidden="true" />
              {t.invalidExample}
            </a>
          </div>
        </aside>
      </div>

      <section
        className="ledger-panel import-active-panel"
        aria-labelledby="active-import-title"
      >
        <div className="ledger-panel-heading">
          <h2 id="active-import-title">{t.activeImport}</h2>
        </div>
        {commit.isError && !commitUncertain && (
          <ImportErrorNotice error={commit.error} locale={locale} />
        )}
        {checkStatus.isError && (
          <ImportErrorNotice error={checkStatus.error} locale={locale} />
        )}
        {!activeId ? (
          <p className="ledger-state">{t.selectHistory}</p>
        ) : detail.isPending ? (
          <p className="ledger-state" role="status">
            {t.detailLoading}
          </p>
        ) : detail.isError && !active ? (
          <div className="ledger-state">
            <ImportErrorNotice error={detail.error} locale={locale} />
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void detail.refetch()}
            >
              {t.retry}
            </button>
          </div>
        ) : active ? (
          <ImportDetailView
            detail={active}
            locale={locale}
            accountName={accountName(active.accountId)}
            categoryName={categoryName}
            acknowledged={acknowledged}
            onAcknowledged={setAcknowledged}
            onCommit={submitCommit}
            committing={commit.isPending || checkStatus.isPending}
            commitUncertain={commitUncertain}
            onCheckStatus={() => checkStatus.mutate(active.id)}
          />
        ) : null}
      </section>

      <section
        className="ledger-panel import-history"
        aria-labelledby="import-history-title"
      >
        <div className="ledger-panel-heading">
          <h2 id="import-history-title">{t.history}</h2>
          <History size={20} aria-hidden="true" />
        </div>
        {history.isPending ? (
          <p className="ledger-state" role="status">
            {t.historyLoading}
          </p>
        ) : history.isError ? (
          <div className="ledger-state">
            <ImportErrorNotice error={history.error} locale={locale} />
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void history.refetch()}
            >
              {t.retry}
            </button>
          </div>
        ) : !history.data.data.length ? (
          <p className="ledger-state">{t.historyEmpty}</p>
        ) : (
          <>
            <div className="import-history-list">
              {history.data.data.map((item) => (
                <button
                  className={`import-history-row${activeId === item.id ? ' is-selected' : ''}`}
                  type="button"
                  key={item.id}
                  onClick={() => selectImport(item)}
                >
                  <span>
                    <strong>{item.filename}</strong>
                    <small>{accountName(item.accountId)}</small>
                  </span>
                  <span
                    className={`import-status import-status--${item.status.toLowerCase()}`}
                  >
                    {item.status === 'COMMITTED'
                      ? t.committedStatus
                      : t.previewStatus}
                  </span>
                  <span className="import-history-counts">
                    {t.total}: <bdi dir="ltr">{item.summary.total}</bdi> ·{' '}
                    {t.invalid}: <bdi dir="ltr">{item.summary.invalid}</bdi>
                  </span>
                  <time dir="ltr">{item.createdAt}</time>
                  <span className="text-button">{t.openDetails}</span>
                </button>
              ))}
            </div>
            <ImportPagination
              page={history.data.meta.page}
              totalPages={history.data.meta.totalPages}
              onPage={(value) => {
                setPage(value);
                setAcknowledged(false);
                setActiveId(null);
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
