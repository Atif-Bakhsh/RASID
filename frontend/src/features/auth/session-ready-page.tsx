'use client';

import { Check, KeyRound, LoaderCircle, LogOut } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

export function SessionReadyPage() {
  const { session, signOut } = useAuth();
  const { messages } = useLocale();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    try {
      await signOut();
    } catch {
      // AuthProvider carries the warning to the public login route because
      // clearing the local session unmounts this protected screen.
    } finally {
      setPending(false);
    }
  }

  if (!session) return null;

  return (
    <div className="session-ready-page">
      <section
        className="session-ready-hero"
        aria-labelledby="session-ready-title"
      >
        <div>
          <span className="eyebrow">
            <span aria-hidden="true" />
            {messages.sessionReadyEyebrow}
          </span>
          <h1 id="session-ready-title">{messages.sessionReadyTitle}</h1>
          <p>{messages.sessionReadyDescription}</p>
        </div>
        <div className="session-check" aria-hidden="true">
          <Check size={40} strokeWidth={1.4} />
        </div>
      </section>

      <section className="session-details" aria-label={messages.sessionStatus}>
        <div>
          <span>{messages.signedInAs}</span>
          <strong dir="ltr">{session.user.email}</strong>
        </div>
        <div>
          <span>{messages.sessionIdentifier}</span>
          <code dir="ltr">{session.sessionId}</code>
        </div>
      </section>

      <section
        className="session-security"
        aria-labelledby="session-security-title"
      >
        <KeyRound size={25} strokeWidth={1.55} aria-hidden="true" />
        <div>
          <h2 id="session-security-title">{messages.sessionSecurityTitle}</h2>
          <p>{messages.sessionSecurityDescription}</p>
          <small>{messages.dashboardPending}</small>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void handleLogout()}
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle
              className="button-spinner"
              size={18}
              aria-hidden="true"
            />
          ) : (
            <LogOut size={18} aria-hidden="true" />
          )}
          {pending ? messages.loggingOut : messages.logoutAction}
        </button>
      </section>
    </div>
  );
}
