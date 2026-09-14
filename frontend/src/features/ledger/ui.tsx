'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import type { Locale } from '@/lib/api/contracts';
import { useLocale } from '@/providers/locale-provider';
import { ledgerMessages } from './messages';

export function LedgerDialog({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const initialFocus =
      dialogRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      ) ?? dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
    initialFocus?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.setTimeout(() => {
        if (previouslyFocused?.isConnected) previouslyFocused.focus();
      }, 0);
    };
  }, [onClose]);
  return (
    <div
      className="ledger-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="ledger-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ledger-dialog-title"
      >
        <header>
          <h2 id="ledger-dialog-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function ApiErrorNotice({
  error,
  locale,
  conflictMessage,
}: {
  error: Error;
  locale: Locale;
  conflictMessage?: string;
}) {
  const t = ledgerMessages[locale];
  const apiError = error instanceof ApiClientError ? error : null;
  const message =
    apiError?.status === 409 && conflictMessage
      ? conflictMessage
      : apiError
        ? apiError.localizedMessage(locale)
        : t.network;
  return (
    <div className="ledger-error" role="alert">
      <strong>{t.loadError}</strong>
      <p>{message}</p>
      {apiError?.requestId && (
        <details>
          <summary>{t.requestReference}</summary>
          <code dir="ltr">{apiError.requestId}</code>
        </details>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <PaginationLocalized
      page={page}
      totalPages={totalPages}
      total={total}
      onPage={onPage}
    />
  );
}

function PaginationLocalized({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const { locale } = useLocale();
  const t = ledgerMessages[locale];
  return (
    <nav className="ledger-pagination" aria-label={t.page}>
      <span>
        {t.total}: <bdi dir="ltr">{total}</bdi>
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
        <span>
          {t.page} <bdi dir="ltr">{page}</bdi> {t.of}{' '}
          <bdi dir="ltr">{Math.max(totalPages, 1)}</bdi>
        </span>
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
