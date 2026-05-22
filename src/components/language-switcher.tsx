"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  en: "EN",
  vi: "VI",
};

export function LanguageSwitcher({ currentLang }: { currentLang: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(lang: Locale) {
    // Replace the current locale prefix with the new one
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
