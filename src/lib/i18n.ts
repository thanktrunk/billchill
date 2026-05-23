// Locale constants — safe to import in edge (proxy), client, and server code.

export const locales = ['en', 'vi'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const hasLocale = (lang: string): lang is Locale => (locales as readonly string[]).includes(lang)
