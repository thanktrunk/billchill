---
name: bc-plan
description: Use when planning a new BillChill feature before writing any code — produces a structured implementation plan and saves it to docs/plans/
---

# BillChill Feature Planning

## Overview

Produce a structured implementation plan for a new BillChill feature. Saves to `docs/plans/<FEATURE-NAME>.md` using the project's established format.

**Announce at start:** "I'm using the bc-plan skill to create the implementation plan."

## Step 1 — Interview the planner

Before touching any code or writing a plan, assess whether the requirement is clear enough to plan from.

**A requirement is clear enough when you can answer all of:**
- What user problem does this solve?
- What does "done" look like — what can a user do that they couldn't before?
- Are there edge cases or constraints that affect the design?

**If any of those are unclear**, use `AskUserQuestion` to interview the planner. Ask up to 4 focused questions at once — one question per unknown. Do NOT ask about things you can derive from the codebase. Do NOT ask things that don't affect the design.

**Examples of good clarifying questions:**
- "Should this work per-group or across all groups?"
- "What happens when a member leaves mid-expense?"
- "Does this replace the existing flow or add alongside it?"

**Examples of bad questions (don't ask these):**
- "Which file should I put this in?" — derive from codebase
- "Do you want me to use TypeScript?" — always yes
- "Should I follow the coding conventions?" — always yes

Wait for the planner's answers before proceeding to Step 2.

## Step 2 — Gather context

After requirements are clear, run these to understand the relevant code:

- `codegraph_context` on any symbols the feature touches
- `codegraph_files` on the affected directories
- Read `CLAUDE.md` for conventions that apply to this area

## Step 2 — Write the plan

Use this exact structure:

```markdown
# Plan: [Feature Name]

## Context
[2–4 sentences: what exists today, what the user wants, key constraints]

---

## 1. [Area] — `path/to/file.ts`

[What changes and why. Include exact field names, function signatures, or JSX structure.]

---

## 2. [Next area] — `path/to/file.ts`

...

---

## Critical files

| File | Action |
|---|---|
| `path/to/file.ts` | [Create / Modify / Delete] — one-line summary |

---

## Verification

1. [Concrete step to confirm it works — CLI command, UI action, or observable result]
2. ...
```

## BillChill-specific planning rules

These must be reflected in the plan:

- **Schema** — `src/db/schema/`. New columns need `npx drizzle-kit push` in Verification.
- **Mutations** — `src/db/mutations/`. One function per operation; never call DB inside pure logic.
- **Queries** — `src/db/queries/`. Parallelize independent DB calls with `Promise.all`.
- **Server actions** — co-locate `actions.ts` next to the page. Always `requireUser()` first, then `verifyGroupMembership()` when touching group data.
- **Auth** — never trust client-supplied user IDs. Plan must show where `requireUser()` is called.
- **i18n** — any new user-visible string needs keys in both `src/messages/en.json` and `src/messages/vi.json`. List them in the plan section that introduces them.
- **DB amounts** — always `parseFloat()` before arithmetic; stored as `numeric(12,2)` strings.
- **Balances** — `calculateBalances()` and `minimizeDebts()` are pure; plan must not route DB calls through them.
- **UI** — use `bc-ui.tsx` primitives before inventing raw JSX. Note which primitive applies.

## Step 3 — Self-review

Before saving, check:

1. **Coverage** — every user-visible behaviour the feature requires has a numbered section.
2. **Auth chain** — every server action section shows `requireUser()` and (if applicable) `verifyGroupMembership()`.
3. **i18n** — every new string has a key listed. No hardcoded English in JSX.
4. **Verification** — at minimum: `npm run build` passes, `npm run lint` clean, plus feature-specific steps.

## Step 4 — Save and hand off

Save to `docs/plans/<FEATURE-NAME>.md` where `<FEATURE-NAME>` is SCREAMING-KEBAB-CASE.

Then tell the user:

> **Plan saved to `docs/plans/<FEATURE-NAME>.md`.** Ready to implement — just say the word and I'll start from section 1.
