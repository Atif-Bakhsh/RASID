import type { Metadata } from 'next';
import { BudgetsPage } from '@/features/management/budgets-page';

export const metadata: Metadata = {
  title: 'الميزانيات والالتزامات · Budgets & obligations',
};

export default function Page() {
  return <BudgetsPage />;
}
