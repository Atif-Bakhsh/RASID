"use client";

import {
  ChartNoAxesCombined,
  CircleDollarSign,
  FileUp,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import type { Messages } from "@/lib/i18n/messages";
import { useLocale } from "@/providers/locale-provider";

import { BrandMark } from "./brand-mark";
import { LanguageToggle } from "./language-toggle";
import { PageContainer } from "./page-container";

interface NavigationItem {
  icon: LucideIcon;
  label: keyof Pick<
    Messages,
    | "overview"
    | "accounts"
    | "transactions"
    | "imports"
    | "budgets"
    | "settings"
  >;
  current?: boolean;
}

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: "overview", current: true },
  { icon: CircleDollarSign, label: "accounts" },
  { icon: ReceiptText, label: "transactions" },
  { icon: FileUp, label: "imports" },
  { icon: ChartNoAxesCombined, label: "budgets" },
  { icon: Settings2, label: "settings" },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { messages } = useLocale();

  return (
    <nav className="primary-navigation" aria-label={messages.navigationLabel}>
      <ul>
        {navigationItems.map(({ current, icon: Icon, label }) => (
          <li key={label}>
            {current ? (
              <a
                className="navigation-link navigation-link--current"
                href="#main-content"
                aria-current="page"
                onClick={onNavigate}
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{messages[label]}</span>
                <span className="navigation-current-dot" aria-hidden="true" />
              </a>
            ) : (
              <span className="navigation-link" aria-disabled="true">
                <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                <span>{messages[label]}</span>
                <span className="navigation-planned">{messages.planned}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { messages } = useLocale();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

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
        className={`mobile-navigation-panel${mobileNavigationOpen ? " is-open" : ""}`}
        id="mobile-navigation"
        aria-hidden={!mobileNavigationOpen}
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
              00
            </span>
            <span>{messages.stageLabel}</span>
          </div>
        </aside>

        <main className="main-column" id="main-content" tabIndex={-1}>
          <header className="topbar">
            <div>
              <span className="topbar-kicker">{messages.currentSection}</span>
              <strong>{messages.overview}</strong>
            </div>
            <LanguageToggle />
          </header>
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
