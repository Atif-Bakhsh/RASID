import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/providers/locale-provider';
import { AppShell } from './app-shell';

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname: () => '/budgets' }));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ signOut: mocks.signOut }),
}));

describe('AppShell', () => {
  beforeEach(() => mocks.signOut.mockReset());

  it('marks the current route and gives the mobile menu keyboard focus behavior', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <AppShell>
          <h1>محتوى الاختبار</h1>
        </AppShell>
      </LocaleProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'الميزانيات والالتزامات' }),
    ).toHaveAttribute('aria-current', 'page');
    const menu = screen.getByRole('button', { name: 'افتح قائمة التنقل' });
    await user.click(menu);
    expect(screen.getAllByRole('link', { name: 'نظرة عامة' })[0]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(menu).toHaveFocus();
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  it('switches the document to English LTR without changing the route', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <AppShell>
          <p>Content</p>
        </AppShell>
      </LocaleProvider>,
    );

    await user.click(
      screen.getAllByRole('button', { name: 'عرض الواجهة بالإنجليزية' })[0],
    );
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(
      screen.getByRole('link', { name: 'Budgets & obligations' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
