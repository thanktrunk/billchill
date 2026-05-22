"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LocaleContext = createContext<{
  lang: string;
  dict: Dictionary;
} | null>(null);

export function LocaleProvider({
  lang,
  dict,
  children,
}: {
  lang: string;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ lang, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
