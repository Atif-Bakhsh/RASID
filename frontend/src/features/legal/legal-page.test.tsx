import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '@/providers/locale-provider';
import { LegalPage } from './legal-page';

describe('LegalPage', () => {
  it('presents the privacy scope and legal-review warning in both locales', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LegalPage kind="privacy" />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'سياسة الخصوصية' }),
    ).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent('تحتاج مراجعة قانونية');
    expect(screen.getByText(/لا تحفظ الواجهة رموز المصادقة/)).toBeVisible();
    expect(screen.getByText(/لا ترفع بيانات مالية حقيقية/)).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'عرض الواجهة بالإنجليزية' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Privacy Policy' }),
    ).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent(
      'professional legal review is required',
    );
    expect(
      screen.getByRole('link', { name: 'Terms & Conditions' }),
    ).toHaveAttribute('href', '/terms');
  });

  it('states the demo-only boundary without invented regulatory claims', () => {
    render(
      <LocaleProvider>
        <LegalPage kind="terms" />
      </LocaleProvider>,
    );
    expect(screen.getByText(/ليس مؤسسة مالية/)).toBeVisible();
    expect(screen.queryByText(/مرخص|معتمد|ISO|PCI/)).not.toBeInTheDocument();
  });
});
