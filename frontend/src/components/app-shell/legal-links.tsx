'use client';

import Link from 'next/link';
import { useLocale } from '@/providers/locale-provider';

export function LegalLinks({ inverse = false }: { inverse?: boolean }) {
  const { messages } = useLocale();
  return (
    <nav
      className={`legal-links${inverse ? ' legal-links--inverse' : ''}`}
      aria-label={messages.legalNavigation}
    >
      <Link href="/privacy">{messages.privacy}</Link>
      <Link href="/terms">{messages.terms}</Link>
    </nav>
  );
}
