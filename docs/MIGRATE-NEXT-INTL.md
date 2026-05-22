# Feature Plan: Migrate i18n to next-intl

## TL;DR

Replace the custom dictionary-based i18n (JSON imports + `LocaleProvider` context) with `next-intl`. URL structure, locales (`en`, `vi`), and JSON translation files stay the same — only the plumbing changes. Removes `LocaleProvider`, `useLocale()`, `getDictionary()`, `dictionaries.ts`. Replaces them with `useTranslations()` / `getTranslations()`.

---

## Why migrate

- **Plurals** — "1 expense" vs "3 expenses" requires manual branching today
- **Interpolation** — dynamic values in strings are stringly-typed today
- **Locale persistence** — cookie stores user's chosen language across sessions
- **Type-safe key paths** — `t('group.title')` with autocomplete
- **Date/number formatting** — `format.number(amount, { style: 'currency' })` respects locale

---

## What stays the same

- URL structure: `/{lang}/...`
- Locales: `en`, `vi`; default: `en`
- Translation JSON files — rename `src/dictionaries/` → `src/messages/`, content unchanged
- Auth0 middleware integration
- `[lang]` dynamic segment in `src/app/`

---

## Phase 1 — Install and configure

1. `npm install next-intl`
2. Rename `src/dictionaries/` → `src/messages/`
3. Create `src/i18n/routing.ts` with `defineRouting({ locales: ['en', 'vi'], defaultLocale: 'en' })`
4. Create `src/i18n/request.ts` using `getRequestConfig` — loads from `src/messages/[locale].json`
5. Wrap `next.config.ts` with `createNextIntlPlugin('./src/i18n/request.ts')`
6. Update `src/middleware.ts` — replace `getPreferredLocale` + redirect with `createMiddleware(routing)`; keep Auth0 check after locale routing

**Verify:** `npm run build` passes, `/groups` redirects to `/en/groups`

---

## Phase 2 — Replace translation infrastructure

7. Delete `src/app/[lang]/dictionaries.ts`
8. Trim `src/lib/i18n.ts` — keep `locales`, `defaultLocale`, `hasLocale` only
9. Delete `src/lib/locale-context.tsx`
10. Update `src/app/[lang]/layout.tsx` — use `getTranslations()` in `generateMetadata`, add `NextIntlClientProvider`
11. Update `src/app/[lang]/(app)/layout.tsx` — remove `getDictionary`, `LocaleProvider`, `dict` prop threading

**Verify:** `npm run build` passes, app renders without errors

---

## Phase 3 — Migrate components and pages

Server: `const t = await getTranslations('namespace'); t('key')`
Client: `const t = useTranslations('namespace'); t('key')`

| File | Type | Namespaces |
|------|------|------------|
| `src/components/language-switcher.tsx` | client | `common` |
| `src/components/bottom-nav.tsx` | client | `nav` |
| `src/app/[lang]/(app)/groups/page.tsx` | server | `groups`, `common` |
| `src/app/[lang]/(app)/groups/new/new-group-form.tsx` | client | `new_group` |
| `src/app/[lang]/(app)/groups/new/page.tsx` | server | `new_group` |
| `src/app/[lang]/(app)/groups/[id]/page.tsx` | server | `group_detail` |
| `src/app/[lang]/(app)/groups/[id]/expenses/new/new-expense-form.tsx` | client | `new_expense` |
| `src/app/[lang]/(app)/groups/[id]/expenses/new/page.tsx` | server | `new_expense` |
| `src/app/[lang]/(app)/notifications/page.tsx` | server | `notifications` |
| `src/app/[lang]/(app)/layout.tsx` | server | multiple |
| `src/app/[lang]/layout.tsx` | server | `meta`, `common` |

Remove `lang` prop threading — next-intl reads locale from request context.

**Verify:** All pages render in `/en/` and `/vi/`

---

## Phase 4 — Locale persistence (optional)

Add `localeCookie: true` to `defineRouting` in `src/i18n/routing.ts`

**Verify:** Switch to `/vi/groups`, refresh — stays on `/vi/`

---

## Phase 5 — Clean up and verify

- `npm run build` — zero TypeScript errors
- `npm run test:e2e` — all 12 tests pass
- Manually verify language switcher for both locales
- Confirm `<html lang="en|vi">` attribute is set

---

## Relevant files

- `src/middleware.ts` — replace locale detection
- `src/app/[lang]/dictionaries.ts` — **delete**
- `src/lib/i18n.ts` — keep locale constants only
- `src/lib/locale-context.tsx` — **delete**
- `src/app/[lang]/layout.tsx` — add `NextIntlClientProvider`
- `src/messages/en.json` / `vi.json` — renamed from `src/dictionaries/`

---

## Decisions

- JSON key structure unchanged — next-intl accepts the same format
- No new locales in scope
- `generateStaticParams` unchanged — returns `[{ lang: 'en' }, { lang: 'vi' }]`
- `lang` prop threading removed in Phase 3
