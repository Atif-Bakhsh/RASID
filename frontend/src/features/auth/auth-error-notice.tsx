'use client';

import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { ApiClientError, ApiNetworkError } from '@/lib/api/errors';
import { useLocale } from '@/providers/locale-provider';

function titleForError(
  error: ApiClientError | ApiNetworkError,
  titles: {
    backend: string;
    conflict: string;
    credentials: string;
    rate: string;
    unexpected: string;
    validation: string;
  },
) {
  if (error instanceof ApiNetworkError) return titles.backend;
  if (error.code === 'INVALID_CREDENTIALS') return titles.credentials;
  if (error.code === 'EMAIL_IN_USE') return titles.conflict;
  if (error.status === 429) return titles.rate;
  if (error.status === 503 || error.status >= 500) return titles.backend;
  if (error.status === 400) return titles.validation;
  return titles.unexpected;
}

export function AuthErrorNotice({
  error,
}: {
  error: ApiClientError | ApiNetworkError;
}) {
  const { locale, messages } = useLocale();
  const [copied, setCopied] = useState(false);
  const title = titleForError(error, {
    backend: messages.backendUnavailableTitle,
    conflict: messages.emailConflictTitle,
    credentials: messages.invalidCredentialsTitle,
    rate: messages.rateLimitedTitle,
    unexpected: messages.unexpectedErrorTitle,
    validation: messages.validationErrorTitle,
  });
  const description =
    error instanceof ApiClientError
      ? error.localizedMessage(locale)
      : locale === 'ar'
        ? 'تعذر الوصول إلى الخادم. تحقق من الاتصال وحاول مجدداً.'
        : 'The server could not be reached. Check the connection and try again.';

  async function copyRequestId(requestId: string) {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="auth-error" role="alert" aria-live="assertive">
      <AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        {error instanceof ApiClientError && error.retryAfter && (
          <p className="auth-error-meta" dir="auto">
            {messages.retryAfter.replace('{value}', error.retryAfter)}
          </p>
        )}
        {error instanceof ApiClientError && error.requestId && (
          <details className="request-reference">
            <summary>{messages.requestReference}</summary>
            <div>
              <code dir="ltr">{error.requestId}</code>
              <button
                type="button"
                onClick={() => void copyRequestId(error.requestId!)}
                aria-label={messages.copyRequestId}
              >
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                <span>
                  {copied ? messages.copiedRequestId : messages.copyRequestId}
                </span>
              </button>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
