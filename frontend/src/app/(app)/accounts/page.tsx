import type { Metadata } from 'next';
import { AccountsPage } from '@/features/ledger/accounts-page';

export const metadata: Metadata = { title: 'الحسابات · Accounts' };

export default function Page() {
  return <AccountsPage />;
}
