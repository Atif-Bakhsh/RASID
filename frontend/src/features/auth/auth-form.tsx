'use client';

import { ArrowLeft, Eye, EyeOff, LoaderCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { getDemoCredentials } from '@/config/env';
import { login, register } from '@/features/auth/api';
import { ApiClientError, ApiNetworkError } from '@/lib/api/errors';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

import { AuthErrorNotice } from './auth-error-notice';

type AuthMode = 'login' | 'register';
type FieldName = 'email' | 'password' | 'timezone';
type FieldErrors = Partial<Record<FieldName, string>>;

function isAuthError(
  error: unknown,
): error is ApiClientError | ApiNetworkError {
  return error instanceof ApiClientError || error instanceof ApiNetworkError;
}

export function getServerFieldErrors(
  error: ApiClientError,
  locale: 'ar' | 'en',
): FieldErrors {
  if (!Array.isArray(error.details)) return {};

  const result: FieldErrors = {};
  for (const detail of error.details) {
    if (!detail || typeof detail !== 'object') continue;
    const field = (detail as { field?: unknown }).field;
    const rules = (detail as { rules?: unknown }).rules;
    if (
      !(['email', 'password', 'timezone'] as const).includes(field as FieldName)
    ) {
      continue;
    }

    const ruleNames = Array.isArray(rules) ? rules : [];
    if (field === 'email') {
      result.email =
        locale === 'ar'
          ? 'تحقق من صيغة البريد الإلكتروني وطوله.'
          : 'Check the email format and length.';
    }
    if (field === 'password') {
      result.password =
        locale === 'ar'
          ? 'يجب أن تتكون كلمة المرور من 12 إلى 128 حرفاً.'
          : 'Password must be between 12 and 128 characters.';
    }
    if (field === 'timezone') {
      result.timezone =
        locale === 'ar'
          ? 'استخدم اسماً صالحاً لمنطقة IANA الزمنية.'
          : 'Use a valid IANA time-zone name.';
    }

    // Preserve a useful generic fallback if the backend adds a new rule.
    if (ruleNames.length === 0 && !result[field as FieldName]) {
      result[field as FieldName] =
        locale === 'ar' ? 'تحقق من هذه القيمة.' : 'Check this value.';
    }
  }
  return result;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { acceptSession, dismissLogoutWarning, logoutWarning } = useAuth();
  const { locale, messages } = useLocale();
  const router = useRouter();
  const demoCredentials = getDemoCredentials();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submissionError, setSubmissionError] = useState<
    ApiClientError | ApiNetworkError | null
  >(null);
  const [statusMessage, setStatusMessage] = useState('');
  const isLogin = mode === 'login';

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) errors.email = messages.emailRequired;
    else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      errors.email = messages.emailInvalid;
    }

    if (!password) errors.password = messages.passwordRequired;
    else if (password.length < 12 || password.length > 128) {
      errors.password = messages.passwordLength;
    }

    if (!isLogin && !timezone.trim()) {
      errors.timezone = messages.timezoneRequired;
    }
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const validationErrors = validate();
    dismissLogoutWarning();
    setFieldErrors(validationErrors);
    setSubmissionError(null);
    setStatusMessage('');
    if (Object.keys(validationErrors).length > 0) return;

    setPending(true);
    try {
      const session = isLogin
        ? await login({ email: email.trim().toLowerCase(), password })
        : await register({
            email: email.trim().toLowerCase(),
            password,
            locale,
            timezone: timezone.trim(),
          });
      acceptSession(session);
      router.replace('/');
    } catch (error) {
      if (isAuthError(error)) {
        setSubmissionError(error);
        if (error instanceof ApiClientError) {
          setFieldErrors(getServerFieldErrors(error, locale));
        }
      } else {
        setSubmissionError(new ApiNetworkError({ cause: error }));
      }
    } finally {
      setPending(false);
    }
  }

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function fillDemoCredentials() {
    if (!demoCredentials) return;
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setFieldErrors({});
    setSubmissionError(null);
    setStatusMessage(messages.demoCredentialsFilled);
  }

  return (
    <div className="auth-form-panel">
      <div className="auth-form-heading">
        <span className="auth-form-index" dir="ltr">
          {isLogin ? '01 / LOGIN' : '01 / REGISTER'}
        </span>
        <h2 id="auth-form-title">
          {isLogin ? messages.loginTitle : messages.registerTitle}
        </h2>
        <p>
          {isLogin ? messages.loginDescription : messages.registerDescription}
        </p>
      </div>

      {logoutWarning && (
        <p className="inline-status inline-status--warning" role="alert">
          {messages.logoutFailed}
        </p>
      )}

      {submissionError && <AuthErrorNotice error={submissionError} />}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={pending}
      >
        <div className="field-group">
          <label htmlFor={`${mode}-email`}>{messages.emailLabel}</label>
          <input
            id={`${mode}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            maxLength={254}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError('email');
            }}
            placeholder={messages.emailPlaceholder}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={
              fieldErrors.email ? `${mode}-email-error` : undefined
            }
            disabled={pending}
          />
          {fieldErrors.email && (
            <span className="field-error" id={`${mode}-email-error`}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor={`${mode}-password`}>{messages.passwordLabel}</label>
            <span>{messages.passwordHint}</span>
          </div>
          <div className="password-field">
            <input
              id={`${mode}-password`}
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              dir="ltr"
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearFieldError('password');
              }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? `${mode}-password-error` : undefined
              }
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={
                passwordVisible ? messages.hidePassword : messages.showPassword
              }
              title={
                passwordVisible ? messages.hidePassword : messages.showPassword
              }
              disabled={pending}
            >
              {passwordVisible ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="field-error" id={`${mode}-password-error`}>
              {fieldErrors.password}
            </span>
          )}
        </div>

        {!isLogin && (
          <div className="field-group">
            <div className="field-label-row">
              <label htmlFor="register-timezone">
                {messages.timezoneLabel}
              </label>
              <span>{messages.timezoneHint}</span>
            </div>
            <input
              id="register-timezone"
              name="timezone"
              type="text"
              autoComplete="off"
              dir="ltr"
              value={timezone}
              onChange={(event) => {
                setTimezone(event.target.value);
                clearFieldError('timezone');
              }}
              aria-invalid={!!fieldErrors.timezone}
              aria-describedby={
                fieldErrors.timezone ? 'register-timezone-error' : undefined
              }
              disabled={pending}
            />
            {fieldErrors.timezone && (
              <span className="field-error" id="register-timezone-error">
                {fieldErrors.timezone}
              </span>
            )}
          </div>
        )}

        <button
          className="button button--primary auth-submit"
          type="submit"
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle
              className="button-spinner"
              size={18}
              aria-hidden="true"
            />
          ) : (
            <ArrowLeft size={18} aria-hidden="true" />
          )}
          {pending
            ? isLogin
              ? messages.loggingIn
              : messages.registering
            : isLogin
              ? messages.loginAction
              : messages.registerAction}
        </button>
      </form>

      <p className="auth-switch">
        {isLogin ? messages.noAccount : messages.haveAccount}{' '}
        <Link href={isLogin ? '/register' : '/login'}>
          {isLogin ? messages.goToRegister : messages.goToLogin}
        </Link>
      </p>

      {isLogin && demoCredentials && (
        <aside className="demo-account" aria-labelledby="demo-account-title">
          <Sparkles size={20} strokeWidth={1.7} aria-hidden="true" />
          <div>
            <strong id="demo-account-title">{messages.demoAccountTitle}</strong>
            <p>{messages.demoAccountDescription}</p>
            <span dir="ltr">{demoCredentials.email}</span>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            disabled={pending}
          >
            {messages.useDemoAccount}
          </button>
        </aside>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
    </div>
  );
}
