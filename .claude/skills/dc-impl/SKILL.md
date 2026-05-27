---
name: dc-impl
description: Use when implementing a feature plan from docs/plans/ — works through each section of the plan in order, following all BillChill coding conventions from CLAUDE.md
---

# BillChill Plan Implementation

## Overview

Implement a saved feature plan from `docs/plans/`. Works section by section, applying every coding convention and quality rule from CLAUDE.md.

**Announce at start:** "I'm using the dc-impl skill to implement the plan."

## Step 1 — Load the plan

If the user named a plan file, read `docs/plans/<FEATURE-NAME>.md`. If they didn't specify one, list `docs/plans/` and ask which plan to implement using `AskUserQuestion`.

Read the full plan before touching any code. Confirm you understand the scope by briefly summarising (1–2 sentences) which files will change and what the end result is.

## Step 2 — Pre-implementation checks

Before writing any code:

1. Use `codegraph_context` on the key symbols mentioned in the plan to verify signatures and callers match what the plan assumes.
2. Use `codegraph_files` on each affected directory to confirm file paths are current.
3. If the plan references a DB schema change, check `src/db/schema/` to confirm the column/table doesn't already exist.

Raise any discrepancy between plan assumptions and current code **before** writing anything. Ask the user how to proceed if there is a conflict.

## Step 3 — Implement section by section

Work through each numbered section of the plan in order. For each section:

1. **Read** the relevant existing file(s) before editing.
2. **Apply** the change described in the plan — no more, no less. Do not add features, refactor unrelated code, or introduce abstractions beyond what the section requires.
3. **Follow every rule** from CLAUDE.md before moving on:

### Coding conventions (enforce on every file touched)

- **Server actions** — co-locate in `actions.ts` next to the page. Always call `requireUser()` first, then `verifyGroupMembership(groupId, userId)` before reading group data.
- **Auth** — never trust client-supplied user IDs. `requireUser()` throws if unauthenticated.
- **DB amounts** — stored as `numeric(12,2)` strings; always `parseFloat()` before arithmetic.
- **Balances** — `calculateBalances()` and `minimizeDebts()` are pure; never call the DB inside them.
- **Locale** — `lang` from the `[lang]` segment on the server; `useLocale()` on the client.
- **i18n** — never hardcode user-visible strings. Add keys to both `src/messages/en.json` and `src/messages/vi.json`. Copy style: casual, short, punchy; emoji welcome on labels and empty states.
- **Queries** — in `src/db/queries/`. Parallelize independent DB calls with `Promise.all`.
- **Mutations** — in `src/db/mutations/`. One function per operation.

### Code quality rules (enforce on every file touched)

- **Reuse before writing** — check `src/lib/`, `src/components/bc-ui.tsx`, and `src/components/ui/` before writing any new utility, primitive, or UI component.
- **Fetch server-side** — pass data as props; don't re-fetch server-available data from the client via `useEffect`.
- **Derive, don't duplicate** — compute values from existing state/props instead of storing derived state.
- **Pre-index render-loop lookups** — build a `Map` before the return; never `.filter()` inside a list render.
- **Typed server action args** — pass typed arguments directly; don't pack/unpack `FormData` when you control both sides.

### Styling rules (enforce on every JSX file touched)

- Tailwind classes only — no `style={{}}` for static values.
- CSS variable shorthand: `bg-(--bc-ink)`, not `bg-[var(--bc-ink)]`.
- Scale tokens over arbitrary values (`py-2.5` not `py-[10px]`).
- `cn()` for conditional or merged classes.
- Active/hover via pseudo-classes, not DOM mutations.

### Comments

- Write no comments by default.
- Add a comment only when the *why* is non-obvious — a hidden constraint, a workaround, or an algorithm invariant.
- Never write JSX block comments that name the thing below them.

## Step 4 — After every section

After completing each section:

1. Run `npm run format` — format all changed files.
2. Run `npm run lint` — fix all lint errors before proceeding to the next section.

Do not proceed to the next section if lint fails.

## Step 5 — Post-implementation

After all sections are done:

1. Run `npm run build` — must pass. Fix any build errors before declaring done.
2. Run `npm run test:e2e` — review `tests/e2e/` and create or update Playwright E2E tests to cover every user-visible behaviour added or changed by this plan.
3. If the plan added a DB schema change, remind the user to run `npx drizzle-kit push`.
4. Update `docs/ARCHITECTURE.md` if the change affects the stack, DB schema, auth flow, access control, algorithms, or deployment config.
5. Update `docs/REQUIREMENTS.md` if the change adds, removes, or modifies any functional or non-functional behaviour.

## Step 6 — Done report

Tell the user:

> **Implementation complete.** Summarise what was built (2–3 bullets), any manual steps required (e.g. `npx drizzle-kit push`, env vars), and what the E2E tests cover.
