import "server-only";
import type { Locale } from "@/lib/i18n";

export { locales, defaultLocale, hasLocale, type Locale } from "@/lib/i18n";

const en = () => import("@/dictionaries/en.json").then((m) => m.default);
const vi = () => import("@/dictionaries/vi.json").then((m) => m.default);

const dictionaries: Record<Locale, typeof en> = { en, vi };

export const getDictionary = (lang: Locale) => dictionaries[lang]();

export type Dictionary = Awaited<ReturnType<typeof en>>;
