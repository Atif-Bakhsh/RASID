"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "./auth-provider";
import { LocaleProvider } from "./locale-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <LocaleProvider>
        <AuthProvider>{children}</AuthProvider>
      </LocaleProvider>
    </QueryProvider>
  );
}
