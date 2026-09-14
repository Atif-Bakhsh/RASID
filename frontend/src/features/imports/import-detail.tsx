'use client';

import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatMoney } from '@/features/overview/format';
import type { Locale } from '@/lib/api/contracts';
import { formatRowError } from './helpers';
import { importMessages } from './messages';
import type { ImportDetail, ImportRowStatus } from './types';

export function ImportDetailView({
  detail,
  locale,
  accountName,
  categoryName,
  acknowledged,
  onAcknowledged,
  onCommit,
  committing,
  commitUncertain,
  onCheckStatus,
}: {
  detail: ImportDetail;
  locale: Locale;
  accountName: string;
  categoryName: (id: string | null) => string;
  acknowledged: boolean;
  onAcknowledged: (value: boolean) => void;
  onCommit: () => void;
  committing: boolean;
  commitUncertain: boolean;
  onCheckStatus: () => void;
}) {
  const t = importMessages[locale];
  const statusLabel = (status: ImportRowStatus) =>
    status === 'ACCEPTED'
      ? t.accepted
      : status === 'DUPLICATE'
        ? t.duplicates
        : t.invalid;
  const mustAcknowledge = detail.summary.invalid > 0;

  return (
    <div className="import-detail">
      <header className="import-detail-header">
        <div>
          <span
            className={`import-status import-status--${detail.status.toLowerCase()}`}
          >
            {detail.status === 'COMMITTED'
              ? t.committedStatus
              : t.previewStatus}
          </span>
          <h3>{detail.filename}</h3>
          <p>
            {t.account}: {accountName}
          </p>
        </div>
        <dl className="import-dates">
          <div>
            <dt>{t.createdAt}</dt>
            <dd>
              <time dir="ltr">{detail.createdAt}</time>
            </dd>
          </div>
          {detail.committedAt && (
            <div>
              <dt>{t.committedAt}</dt>
              <dd>
                <time dir="ltr">{detail.committedAt}</time>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <section aria-labelledby="preview-counts-title">
        <div className="ledger-panel-heading import-subheading">
          <h4 id="preview-counts-title">{t.previewCounts}</h4>
        </div>
        <dl className="import-counts">
          <Count label={t.total} value={detail.summary.total} />
          <Count
            label={t.accepted}
            value={detail.summary.accepted}
            tone="good"
          />
          <Count
            label={t.duplicates}
            value={detail.summary.duplicates}
            tone="warning"
          />
          <Count label={t.invalid} value={detail.summary.invalid} tone="bad" />
        </dl>
      </section>

      {detail.result && (
        <section
          className="import-result"
          aria-labelledby="commit-counts-title"
        >
          <div className="ledger-panel-heading import-subheading">
            <h4 id="commit-counts-title">{t.commitCounts}</h4>
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <dl className="import-counts import-counts--result">
            <Count
              label={t.inserted}
              value={detail.result.inserted}
              tone="good"
            />
            <Count
              label={t.duplicates}
              value={detail.result.duplicates}
              tone="warning"
            />
            <Count label={t.invalid} value={detail.result.invalid} tone="bad" />
          </dl>
          <p className="import-contract-note">{t.countsMayChange}</p>
          <p className="import-contract-note">{t.historicalResult}</p>
        </section>
      )}

      <section aria-labelledby="import-rows-title">
        <div className="ledger-panel-heading import-subheading">
          <h4 id="import-rows-title">{t.rows}</h4>
          <span>
            {t.total}: <bdi dir="ltr">{detail.rows.length}</bdi>
          </span>
        </div>
        <div
          className="overview-table-wrap import-table-wrap"
          role="region"
          aria-label={t.rows}
          tabIndex={0}
        >
          <table className="overview-table import-table">
            <thead>
              <tr>
                <th scope="col">{t.row}</th>
                <th scope="col">{t.status}</th>
                <th scope="col">{t.date}</th>
                <th scope="col">{t.merchant}</th>
                <th scope="col">{t.direction}</th>
                <th scope="col">{t.amount}</th>
                <th scope="col">{t.category}</th>
                <th scope="col">{t.reference}</th>
                <th scope="col">{t.errors}</th>
              </tr>
            </thead>
            <tbody>
              {detail.rows.map((row) => (
                <tr key={row.row}>
                  <th scope="row">
                    <bdi dir="ltr">{row.row}</bdi>
                  </th>
                  <td>
                    <span
                      className={`row-status row-status--${row.status.toLowerCase()}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  {row.record ? (
                    <>
                      <td>
                        <time dir="ltr">{row.record.postedAt}</time>
                      </td>
                      <td>{row.record.merchant}</td>
                      <td>
                        {row.record.direction === 'INCOME'
                          ? t.income
                          : t.expense}
                      </td>
                      <td>
                        <span className="money" dir="ltr">
                          {formatMoney(row.record.amount)}
                        </span>
                      </td>
                      <td>{categoryName(row.record.categoryId)}</td>
                      <td>
                        {row.record.reference ? (
                          <bdi dir="ltr">{row.record.reference}</bdi>
                        ) : (
                          '—'
                        )}
                      </td>
                    </>
                  ) : (
                    <td colSpan={6}>{t.noRecord}</td>
                  )}
                  <td>
                    {row.errors.length ? (
                      <ul className="row-errors">
                        {row.errors.map((error) => (
                          <li key={error}>{formatRowError(error, locale)}</li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {detail.status === 'PREVIEW' && (
        <div className="import-commit-zone">
          {mustAcknowledge && (
            <label className="import-acknowledgement">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => onAcknowledged(event.target.checked)}
              />
              <span>
                <AlertTriangle size={20} aria-hidden="true" />
                {t.acknowledge}
              </span>
            </label>
          )}
          {mustAcknowledge && !acknowledged && (
            <p className="field-error">{t.acknowledgeRequired}</p>
          )}
          {commitUncertain && (
            <div className="commit-uncertain" role="alert">
              <strong>{t.commitUncertain}</strong>
              <button
                className="button button--secondary"
                type="button"
                disabled={committing}
                onClick={onCheckStatus}
              >
                {t.checkStatus}
              </button>
            </div>
          )}
          <button
            className="button button--primary"
            type="button"
            disabled={committing || (mustAcknowledge && !acknowledged)}
            onClick={onCommit}
          >
            {commitUncertain && <RotateCcw size={18} aria-hidden="true" />}
            {committing
              ? t.committing
              : commitUncertain
                ? t.retrySameImport
                : t.commit}
          </button>
        </div>
      )}
    </div>
  );
}

function Count({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'good' | 'warning' | 'bad';
}) {
  return (
    <div className={`import-count import-count--${tone}`}>
      <dt>{label}</dt>
      <dd dir="ltr">{value}</dd>
    </div>
  );
}
