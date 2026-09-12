"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/providers/locale-provider";

export function LanguageToggle({ inverse = false }: { inverse?: boolean }) {
  const { locale, messages, toggleLocale } = useLocale();

  return (
    <button
      className={`language-toggle${inverse ? " language-toggle--inverse" : ""}`}
      type="button"
      onClick={toggleLocale}
      aria-label={messages.switchLanguage}
      title={messages.switchLanguage}
    >
      <Languages size={16} strokeWidth={1.8} aria-hidden="true" />
      <span dir={locale === "ar" ? "ltr" : "rtl"}>
        {locale === "ar" ? "EN" : "عربي"}
      </span>
    </button>
  );
}
