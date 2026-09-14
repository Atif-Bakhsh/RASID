'use client';

import { KeyRound, LockKeyhole, PanelsTopLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { BrandMark } from '@/components/app-shell/brand-mark';
import { LanguageToggle } from '@/components/app-shell/language-toggle';
import { useLocale } from '@/providers/locale-provider';

export function AuthShell({ children }: { children: ReactNode }) {
  const { messages } = useLocale();
  const assurances = [
    { icon: KeyRound, text: messages.authPromiseOne },
    { icon: LockKeyhole, text: messages.authPromiseTwo },
    { icon: PanelsTopLeft, text: messages.authPromiseThree },
  ];

  return (
    <main className="auth-shell" id="main-content">
      <a className="skip-link" href="#auth-form-title">
        {messages.skipToContent}
      </a>

      <section className="auth-story" aria-labelledby="auth-story-title">
        <div className="auth-story-header">
          <BrandMark />
          <LanguageToggle inverse />
        </div>

        <div className="auth-story-copy">
          <span className="auth-kicker">
            <span aria-hidden="true" />
            {messages.authEyebrow}
          </span>
          <h1 id="auth-story-title">{messages.authWelcomeTitle}</h1>
          <p>{messages.authWelcomeDescription}</p>
        </div>

        <ol className="auth-assurances">
          {assurances.map(({ icon: Icon, text }, index) => (
            <li key={text}>
              <span className="auth-assurance-index" dir="ltr">
                0{index + 1}
              </span>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="auth-workspace">
        <div className="auth-mobile-header">
          <BrandMark />
          <LanguageToggle />
        </div>
        <div className="auth-workspace-inner">{children}</div>
      </section>
    </main>
  );
}
