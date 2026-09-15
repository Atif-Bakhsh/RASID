import type { Metadata } from 'next';
import { ImportsPage } from '@/features/imports/imports-page';

export const metadata: Metadata = { title: 'استيراد CSV · CSV imports' };

export default function Page() {
  return <ImportsPage />;
}
