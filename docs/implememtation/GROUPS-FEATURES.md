# Groups Feature Additions

## Context
The Groups feature is partially implemented. Requirements specify 4 tabs (Expenses, Balances, Members, Settings), expense CRUD, all 4 split methods, and a notifications system. Currently only 2 tabs exist, expense creation supports only equal splits in the UI (server already handles all 4), and there's no member management, settings editing, expense editing/deletion, or notifications UI.

---

## 1. Members Tab

**New files:**
- `src/app/[lang]/(app)/groups/[id]/members/actions.ts`

**Modified files:**
- `src/app/[lang]/(app)/groups/[id]/group-detail-client.tsx` — add "Members" tab (BCTabs already used)
- `src/app/[lang]/(app)/groups/[id]/page.tsx` — pass member data down

**Server actions (members/actions.ts):**
- `inviteMember(groupId, email)` — look up user by email in `users` table; if found, create `groupMembers` row with `userId`; if not, create row with `displayName = email` and `userId = null`
- `updateMember(memberId, { displayName, defaultShare, isActive })` — update `groupMembers` row after verifying caller is in the group
- `removeMember(memberId)` — set `isActive = false`

**UI (inside group-detail-client.tsx, Members tab):**
- List of `groupMembers` with avatar, name, defaultShare weight, active toggle
- Inline edit row (tap member → expand to edit displayName + defaultShare)
- Email invite input at bottom → calls `inviteMember`

---

## 2. Settings Tab

**New files:**
- `src/app/[lang]/(app)/groups/[id]/settings/actions.ts`

**Modified files:**
- `src/app/[lang]/(app)/groups/[id]/group-detail-client.tsx` — add "Settings" tab
- `src/app/[lang]/(app)/groups/[id]/page.tsx` — pass group record down

**Server actions (settings/actions.ts):**
- `updateGroup(groupId, { name, currency })` — update `groups` row; caller must be a member
- `archiveGroup(groupId)` — set `archivedAt = now()`; redirect to `/groups`

**UI (Settings tab):**
- Text input for group name (pre-filled)
- Currency selector (same as create-group form)
- Save button → `updateGroup`
- Danger zone: "Archive Group" button with confirmation → `archiveGroup`

---

## 3. Expense Detail / Edit / Delete

**New files:**
- `src/app/[lang]/(app)/groups/[id]/expenses/[expenseId]/page.tsx`
- `src/app/[lang]/(app)/groups/[id]/expenses/[expenseId]/expense-detail-client.tsx`
- `src/app/[lang]/(app)/groups/[id]/expenses/[expenseId]/actions.ts`

**Modified files:**
- `src/app/[lang]/(app)/groups/[id]/group-detail-client.tsx` — make expense items tappable (link to detail)
- `src/app/[lang]/(app)/groups/[id]/expenses/new/new-expense-form.tsx` — extract form logic into a shared component reused by both new and edit

**Server actions ([expenseId]/actions.ts):**
- `getExpense(expenseId)` — fetch expense + splits, verify caller is in the group
- `updateExpense(expenseId, data)` — delete old splits, recalculate, insert new splits; reuse `calculateSplits` from `new/actions.ts`
- `deleteExpense(expenseId)` — delete expense + cascade splits; redirect back to group

**UI (expense-detail-client.tsx):**
- Read-only view: amount, payer, description, category, date, split breakdown
- Edit button → switch to edit mode (same fields as new-expense form)
- Delete button with confirmation

---

## 4. All Split Methods (Expense Form)

**Modified files:**
- `src/app/[lang]/(app)/groups/[id]/expenses/new/new-expense-form.tsx`

**Changes:**
- Add split method selector in Step 2 (BCChip row): Equal | By amount | By shares | By percentage
- **Equal** — current behaviour (select members, divide equally)
- **By amount** — per-member numeric input; validate sum === total
- **By shares** — per-member share input (pre-fill from `defaultShare`); show computed amount per member
- **By percentage** — per-member percentage input; validate sum === 100%; show computed amount
- Pass `splitMethod` + per-member values to existing `addExpense` action (which already handles all 4 methods)

---

## 5. Notifications

**Modified files:**
- `src/app/[lang]/(app)/groups/[id]/expenses/new/actions.ts` — after `addExpense` succeeds, insert a notification row per group member (type: `expense_added`)
- `src/app/[lang]/(app)/groups/[id]/settle/actions.ts` — after `recordSettlement`, insert notification rows (type: `settlement_recorded`)
- `src/app/[lang]/(app)/groups/new/actions.ts` — after `createGroup`, insert notification for creator (type: `member_added`); extend for invited members later
- `src/app/[lang]/(app)/layout.tsx` (or nav component) — bell icon with unread count badge; fetch count server-side

**New files:**
- `src/app/[lang]/(app)/notifications/page.tsx` — list all notifications for current user
- `src/app/[lang]/(app)/notifications/actions.ts` — `markRead(notificationId)`, `markAllRead()`

**DB:** `notifications` table already exists with: `userId`, `groupId`, `type` (enum), `message`, `isRead`, `createdAt`

**UI (notifications page):**
- List of notifications grouped or sorted by date
- Each row: icon by type, message, relative time, unread dot
- Tap → mark as read + navigate to relevant group
- "Mark all read" button at top

---

## Execution Order

1. All split methods (isolated to one file, low risk)
2. Expense detail / edit / delete (standalone routes)
3. Members tab (new tab + actions)
4. Settings tab (new tab + actions)
5. Notifications (cross-cutting: touch multiple existing actions)

---

## Critical Files

| File | Role |
|---|---|
| `src/app/[lang]/(app)/groups/[id]/group-detail-client.tsx` | Add Members + Settings tabs |
| `src/app/[lang]/(app)/groups/[id]/expenses/new/new-expense-form.tsx` | Add split method selector |
| `src/app/[lang]/(app)/groups/[id]/expenses/new/actions.ts` | Reuse `calculateSplits`; add notification triggers |
| `src/db/schema/notifications.ts` | Already defined — use as-is |
| `src/db/schema/groups.ts` | `groupMembers` — invite/edit/remove |
| `src/components/bc-ui.tsx` | BCChip, BCCard, BCButton, BCTabs, BCAvatar for new UI |

---

## Verification

After each feature:
1. `npm run format && npm run lint` — zero errors
2. `npm run build` — must pass
3. `npm run test:e2e` — add/update Playwright tests for each new user flow:
   - Members: invite → member appears; edit name; deactivate
   - Settings: rename group; archive → removed from list
   - Expense detail: tap expense → detail; edit; delete → gone from list
   - Split methods: add expense with each of 4 methods; verify splits sum to total
   - Notifications: add expense → notification appears; mark read → unread count drops
