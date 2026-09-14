import type { Metadata } from 'next';

import { AuthForm } from '@/features/auth/auth-form';

export const metadata: Metadata = {
  title: 'إنشاء حساب',
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
