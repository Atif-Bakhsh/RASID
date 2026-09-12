import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/noto-kufi-arabic/600.css";
import "@fontsource/noto-kufi-arabic/700.css";

import { DemoNotice } from "@/components/app-shell/demo-notice";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RASID — وضوح مالي",
    template: "%s | RASID",
  },
  description:
    "واجهة عربية لعرض بيانات مالية تجريبية بوضوح، دون اتصال بالبنوك.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <AppProviders>
          <DemoNotice />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
