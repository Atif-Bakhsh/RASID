import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/legal-page';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية · Privacy Policy',
  description:
    'سياسة خصوصية نسخة RASID التجريبية / Privacy policy for the RASID demo.',
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
