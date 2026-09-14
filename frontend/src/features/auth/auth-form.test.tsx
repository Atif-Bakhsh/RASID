import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LanguageToggle } from '@/components/app-shell/language-toggle';
import type { AuthSession } from '@/lib/api/contracts';
import { ApiClientError } from '@/lib/api/errors';
import { LocaleProvider } from '@/providers/locale-provider';

import { AuthForm } from './auth-form';

const mocks = vi.hoisted(() => ({
  acceptSession: vi.fn(),
  dismissLogoutWarning: vi.fn(),
  login: vi.fn(),
  logoutWarning: false,
  register: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/features/auth/api', () => ({
  login: mocks.login,
  register: mocks.register,
}));

vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    acceptSession: mocks.acceptSession,
    dismissLogoutWarning: mocks.dismissLogoutWarning,
    logoutWarning: mocks.logoutWarning,
  }),
}));

const session: AuthSession = {
  accessToken: 'memory-token',
  expiresIn: 900,
  sessionId: '62aef265-9cce-41d8-a33d-eedd81ef0a1a',
  tokenType: 'Bearer',
  user: {
    createdAt: '2026-09-12T10:00:00.000Z',
    dataMode: 'DEMO_ONLY',
    email: 'atif@example.test',
    id: 'f72afe0a-c153-49b4-b675-c4d6d8ce6c23',
    locale: 'ar',
    timezone: 'Asia/Riyadh',
  },
};

function renderForm(mode: 'login' | 'register', withToggle = false) {
  return render(
    <LocaleProvider>
      {withToggle && <LanguageToggle />}
      <AuthForm mode={mode} />
    </LocaleProvider>,
  );
}

describe('AuthForm', () => {
  beforeEach(() => {
    mocks.acceptSession.mockReset();
    mocks.dismissLogoutWarning.mockReset();
    mocks.login.mockReset();
    mocks.logoutWarning = false;
    mocks.register.mockReset();
    mocks.replace.mockReset();
  });

  it('shows an honest warning after a logout request failed', () => {
    mocks.logoutWarning = true;
    renderForm('login');

    expect(
      screen.getByText(
        'تعذر تأكيد تسجيل الخروج لدى الخادم. مُسحت الجلسة المحلية لحمايتك، وقد تعود الجلسة عند استعادة الاتصال.',
      ),
    ).toBeInTheDocument();
  });

  it('shows localized inline validation without calling the API', async () => {
    const user = userEvent.setup();
    renderForm('login');

    await user.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    expect(screen.getByText('أدخل البريد الإلكتروني.')).toBeInTheDocument();
    expect(screen.getByText('أدخل كلمة المرور.')).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('fills the documented demo account and renders an invalid-credentials error', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue(
      new ApiClientError(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is incorrect.',
            messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
          },
          requestId: 'request-auth-401',
          timestamp: '2026-09-12T10:00:00.000Z',
        },
        401,
      ),
    );
    renderForm('login');

    await user.click(
      screen.getByRole('button', { name: 'استخدم بيانات العرض' }),
    );
    expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue(
      'atif@example.test',
    );

    await user.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    expect(await screen.findByText('تعذر تسجيل الدخول')).toBeInTheDocument();
    expect(
      screen.getByText('البريد الإلكتروني أو كلمة المرور غير صحيحة.'),
    ).toBeInTheDocument();
    expect(mocks.login).toHaveBeenCalledWith({
      email: 'atif@example.test',
      password: 'Synthetic-Demo-Only-2026!',
    });
  });

  it('submits the selected English locale when registering', async () => {
    const user = userEvent.setup();
    mocks.register.mockResolvedValue({
      ...session,
      user: { ...session.user, email: 'new@example.test', locale: 'en' },
    });
    renderForm('register', true);

    await user.click(
      screen.getByRole('button', { name: 'عرض الواجهة بالإنجليزية' }),
    );
    await user.type(screen.getByLabelText('Email address'), 'new@example.test');
    await user.type(
      screen.getByLabelText('Password'),
      'A-Synthetic-Password-2026!',
    );
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(mocks.register).toHaveBeenCalledWith({
      email: 'new@example.test',
      locale: 'en',
      password: 'A-Synthetic-Password-2026!',
      timezone: 'Asia/Riyadh',
    });
    expect(mocks.acceptSession).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
});
