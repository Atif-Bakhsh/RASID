'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import type { Locale } from '@/lib/api/contracts';
import { useLocale } from '@/providers/locale-provider';
import { importMessages } from './messages';

export function ImportErrorNotice({
  error,
  locale,
}: {
  error: Error;
  locale: Locale;
}) {
  const t = importMessages[locale];
  const apiError = error instanceof ApiClientError ? error : null;
  const [copied, setCopied] = useState(false);
  async function copyRequestId(requestId: string) {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="ledger-error" role="alert">
      <strong>{t.loadError}</strong>
      <p>{apiError ? apiError.localizedMessage(locale) : t.network}</p>
      {apiError?.status === 429 && apiError.retryAfter && (
        <p>
          {t.retryAfter} <bdi dir="ltr">{apiError.retryAfter}</bdi> {t.seconds}.
        </p>
      )}
      {apiError?.requestId && (
        <details className="request-reference">
          <summary>{t.requestReference}</summary>
          <div>
            <code dir="ltr">{apiError.requestId}</code>
            <button
              type="button"
              onClick={() => void copyRequestId(apiError.requestId!)}
              aria-label={t.copyRequestId}
            >
              {copied ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              <span>{copied ? t.copiedRequestId : t.copyRequestId}</span>
            </button>
          </div>
        </details>
      )}
    </div>
  );
}

export function ImportPagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const { locale } = useLocale();
  const t = importMessages[locale];
  return (
    <nav className="ledger-pagination" aria-label={t.page}>
      <span>
        {t.page} <bdi dir="ltr">{page}</bdi> {t.of}{' '}
        <bdi dir="ltr">{Math.max(totalPages, 1)}</bdi>
      </span>
      <div>
        <button
          className="button button--secondary"
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t.previous}
        </button>
        <button
          className="button button--secondary"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {t.next}
        </button>
      </div>
    </nav>
  );
}
