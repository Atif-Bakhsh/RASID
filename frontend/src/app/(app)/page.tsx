import type { Metadata } from 'next';
import { OverviewPage } from '@/features/overview/overview-page';

export const metadata: Metadata = { title: 'نظرة عامة · Overview' };

export default function Home() {
  return <OverviewPage />;
}
