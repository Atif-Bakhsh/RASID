'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Locale } from '@/lib/api/contracts';
import { messages, type Messages } from '@/lib/i18n/messages';

interface LocaleContextValue {
  locale: Locale;
  direction: 'rtl' | 'ltr';
  messages: Messages;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ar');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      direction,
      messages: messages[locale],
      setLocale,
      toggleLocale: () =>
        setLocale((current) => (current === 'ar' ? 'en' : 'ar')),
    }),
    [direction, locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider.');
  }

  return context;
}
