import type { Metadata } from 'next';
import { TransactionsPage } from '@/features/ledger/transactions-page';

export const metadata: Metadata = { title: 'المعاملات · Transactions' };

export default function Page() {
  return <TransactionsPage />;
}
