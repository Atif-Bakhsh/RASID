import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LanguageToggle } from '@/components/app-shell/language-toggle';
import { ApiClientError, ApiNetworkError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';

import { AuthErrorNotice } from './auth-error-notice';

function apiError(
  status: number,
  code: string,
  retryAfter?: string,
): ApiClientError {
  return new ApiClientError(
    {
      error: {
        code,
        message: 'English server message.',
        messageAr: 'رسالة الخادم العربية.',
      },
      requestId: 'request-error-state',
      timestamp: '2026-09-12T10:00:00.000Z',
    },
    status,
    retryAfter,
  );
}

describe('AuthErrorNotice', () => {
  it('presents an email conflict with the Arabic server message and request ID', () => {
    render(
      <LocaleProvider>
        <AuthErrorNotice error={apiError(409, 'EMAIL_IN_USE')} />
      </LocaleProvider>,
    );

    expect(screen.getByText('البريد مستخدم بالفعل')).toBeInTheDocument();
    expect(screen.getByText('رسالة الخادم العربية.')).toBeInTheDocument();
    expect(screen.getByText('مرجع الطلب')).toBeInTheDocument();
  });

  it('presents rate limiting and Retry-After in English mode', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LanguageToggle />
        <AuthErrorNotice error={apiError(429, 'RATE_LIMITED', '42')} />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'عرض الواجهة بالإنجليزية' }),
    );

    expect(
      screen.getByText('Too many attempts in a short time'),
    ).toBeInTheDocument();
    expect(screen.getByText('English server message.')).toBeInTheDocument();
    expect(screen.getByText('You can try again after: 42')).toBeInTheDocument();
  });

  it('distinguishes a network failure from invalid form data', () => {
    render(
      <LocaleProvider>
        <AuthErrorNotice error={new ApiNetworkError()} />
      </LocaleProvider>,
    );

    expect(screen.getByText('خدمة RASID غير متاحة الآن')).toBeInTheDocument();
    expect(
      screen.getByText('تعذر الوصول إلى الخادم. تحقق من الاتصال وحاول مجدداً.'),
    ).toBeInTheDocument();
  });
});
