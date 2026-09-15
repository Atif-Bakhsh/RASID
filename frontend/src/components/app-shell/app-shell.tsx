'use client';

import {
  ChartNoAxesCombined,
  CircleDollarSign,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings2,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { Messages } from '@/lib/i18n/messages';
import { useLocale } from '@/providers/locale-provider';
import { useAuth } from '@/providers/auth-provider';

import { BrandMark } from './brand-mark';
import { LanguageToggle } from './language-toggle';
import { LegalLinks } from './legal-links';
import { PageContainer } from './page-container';

interface NavigationItem {
  icon: LucideIcon;
  label: keyof Pick<
    Messages,
    | 'overview'
    | 'accounts'
    | 'transactions'
    | 'imports'
    | 'budgets'
    | 'settings'
  >;
  href:
    '/' | '/accounts' | '/transactions' | '/imports' | '/budgets' | '/settings';
}

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'overview', href: '/' },
  { icon: CircleDollarSign, label: 'accounts', href: '/accounts' },
  { icon: ReceiptText, label: 'transactions', href: '/transactions' },
  { icon: FileUp, label: 'imports', href: '/imports' },
  { icon: ChartNoAxesCombined, label: 'budgets', href: '/budgets' },
  { icon: Settings2, label: 'settings', href: '/settings' },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { messages } = useLocale();
  const pathname = usePathname();

  return (
    <nav className="primary-navigation" aria-label={messages.navigationLabel}>
      <ul>
        {navigationItems.map(({ href, icon: Icon, label }) => (
          <li key={label}>
            <Link
              className={`navigation-link${pathname === href ? ' navigation-link--current' : ''}`}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              onClick={onNavigate}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{messages[label]}</span>
              <span className="navigation-current-dot" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { messages } = useLocale();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const currentLabel =
    pathname === '/accounts'
      ? messages.accounts
      : pathname === '/transactions'
        ? messages.transactions
        : pathname === '/imports'
          ? messages.imports
          : pathname === '/budgets'
            ? messages.budgets
            : pathname === '/settings'
              ? messages.settings
              : messages.overview;

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    mobileNavigationRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileNavigationOpen(false);
      mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavigationOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      // The auth provider carries a failed server-logout warning to login.
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="application-frame">
      <a className="skip-link" href="#main-content">
        {messages.skipToContent}
      </a>

      <div className="mobile-header">
        <BrandMark />
        <div className="mobile-header-actions">
          <LanguageToggle inverse />
          <button
            ref={mobileMenuButtonRef}
            className="mobile-menu-button"
            type="button"
            aria-label={
              mobileNavigationOpen
                ? messages.closeNavigation
                : messages.openNavigation
            }
            aria-expanded={mobileNavigationOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileNavigationOpen((open) => !open)}
          >
            {mobileNavigationOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        ref={mobileNavigationRef}
        className={`mobile-navigation-panel${mobileNavigationOpen ? ' is-open' : ''}`}
        id="mobile-navigation"
        aria-hidden={!mobileNavigationOpen}
        inert={!mobileNavigationOpen ? true : undefined}
      >
        <Navigation onNavigate={() => setMobileNavigationOpen(false)} />
      </div>

      <div className="app-layout">
        <aside className="desktop-sidebar">
          <div>
            <BrandMark />
            <p className="brand-subtitle">{messages.productSubtitle}</p>
          </div>
          <Navigation />
          <div className="sidebar-footer">
            <span className="sidebar-stage-index" dir="ltr">
              RASID
            </span>
            <span>{messages.productSubtitle}</span>
          </div>
        </aside>

        <main className="main-column" id="main-content" tabIndex={-1}>
          <header className="topbar">
            <div>
              <span className="topbar-kicker">{messages.currentSection}</span>
              <strong>{currentLabel}</strong>
            </div>
            <LanguageToggle />
          </header>
          <PageContainer>
            {children}
            <footer className="app-session-footer">
              <LegalLinks />
              <button
                className="button button--secondary"
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                <LogOut size={18} aria-hidden="true" />
                {loggingOut ? messages.loggingOut : messages.logoutAction}
              </button>
            </footer>
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
