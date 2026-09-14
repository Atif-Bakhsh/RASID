'use client';

import { ShieldCheck } from 'lucide-react';

import { useLocale } from '@/providers/locale-provider';

export function DemoNotice() {
  const { messages } = useLocale();

  return (
    <div className="demo-notice" role="note">
      <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
      <span>{messages.demoNotice}</span>
    </div>
  );
}
