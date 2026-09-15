import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/legal-page';

export const metadata: Metadata = {
  title: 'الشروط والأحكام · Terms & Conditions',
  description:
    'شروط استخدام نسخة RASID التجريبية / Terms for using the RASID demo.',
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
