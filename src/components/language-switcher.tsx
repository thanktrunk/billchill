"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { locales, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  en: "EN",
  vi: "VI",
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLang = useLocale();

  function switchTo(lang: Locale) {
    const segments = pathname.split("/");
    segments[1] = lang;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          className={
            lang === currentLang
              ? "text-xs font-semibold text-foreground"
              : "text-xs text-muted-foreground hover:text-foreground"
          }
          aria-label={`Switch to ${lang}`}
        >
          {labels[lang]}
        </button>
      ))}
    </div>
  );
}
