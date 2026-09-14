import type { ApiFailure, Locale } from './contracts';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly messageAr: string;
  readonly requestId?: string;
  readonly details?: unknown[];
  readonly retryAfter?: string;

  constructor(failure: ApiFailure, status: number, retryAfter?: string) {
    super(failure.error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = failure.error.code;
    this.messageAr = failure.error.messageAr;
    this.requestId = failure.requestId;
    this.details = failure.error.details;
    this.retryAfter = retryAfter;
  }

  localizedMessage(locale: Locale): string {
    return locale === 'ar' ? this.messageAr : this.message;
  }
}

export class ApiNetworkError extends Error {
  constructor(options?: ErrorOptions) {
    super('The RASID API could not be reached.', options);
    this.name = 'ApiNetworkError';
  }
}

export function isApiFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<ApiFailure>;
  return (
    typeof candidate.requestId === 'string' &&
    typeof candidate.timestamp === 'string' &&
    !!candidate.error &&
    typeof candidate.error.code === 'string' &&
    typeof candidate.error.message === 'string' &&
    typeof candidate.error.messageAr === 'string'
  );
}
