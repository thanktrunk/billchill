# Plan: Notification Content i18n

## Context

Notification messages are baked as English template literals at write time in 4 action files, stored verbatim in the `notifications.message` DB column, and rendered as-is on the notifications page. Switching to Vietnamese has no effect on notification content. The page already uses `next-intl` for UI labels (title, type chips, empty state) — only the `n.message` body bypasses i18n.

The fix: add a `messageParams` JSONB column to `notifications`. Action files store structured interpolation data alongside the English fallback. The page renders from `messageParams` using `t(key, params)` when present, falling back to the raw `message` for pre-existing notifications.

---

## 1. DB schema — `src/db/schema/notifications.ts`

Add a nullable `messageParams` JSONB column. No migration needed for existing rows — they fall back to `message`.

```ts
messageParams: jsonb('message_params').$type<Record<string, string>>(),
```

Run `npx drizzle-kit push` after this change.

---

## 2. i18n message keys — `src/messages/en.json` and `src/messages/vi.json`

Add to the `activity` namespace. Keys follow `msg_<type>` convention. Variables use `next-intl` ICU syntax (`{actor}`, `{description}`, etc.).

**Keys to add:**

| Key | EN value | VI value |
|---|---|---|
| `msg_expense_added` | `{actor} added "{description}" ({currency} {amount})` | `{actor} thêm "{description}" ({currency} {amount})` |
| `msg_settlement_paid` | `{from} paid {to} {amount}` | `{from} trả {to} {amount}` |
| `msg_member_added_you` | `You were added to "{group}" by {actor}` | `{actor} đã thêm bạn vào "{group}"` |
| `msg_member_added_other` | `You added {name} to "{group}"` | `Bạn đã thêm {name} vào "{group}"` |
| `msg_member_readded_you` | `You were re-added to "{group}" by {actor}` | `{actor} đã thêm bạn lại vào "{group}"` |
| `msg_member_readded_other` | `You re-added {name} to "{group}"` | `Bạn đã thêm lại {name} vào "{group}"` |
| `msg_member_renamed_self` | `You renamed "{from}" to "{to}"` | `Bạn đổi tên "{from}" thành "{to}"` |
| `msg_member_renamed_other` | `{actor} renamed "{from}" to "{to}"` | `{actor} đổi tên "{from}" thành "{to}"` |
| `msg_member_joined` | `{name} joined "{group}"` | `{name} đã vào "{group}"` |

---

## 3. Mutation function signatures — `src/db/mutations/`

Update each notification-creation function to accept an optional `messageParams` field in the row type. No DB logic changes — just pass it through to `db.insert`.

Files:
- `src/db/mutations/expenses.ts` — `createExpenseAddedNotifications`
- `src/db/mutations/settlements.ts` — `createSettlementRecordedNotifications`
- `src/db/mutations/group-members.ts` — `createMemberAddedNotifications`, `createMemberRenamedNotifications`

Add `messageParams?: Record<string, string>` to each row type.

---

## 4. Expense action — `src/app/[lang]/(app)/groups/[id]/expenses/new/actions.ts`

The current notification row (line ~92):
```ts
message: `${actorName} added "${description.trim()}" (${group?.currency ?? ''} ${amount.toFixed(2)})`
```

Add `messageParams`:
```ts
messageParams: {
  key: 'msg_expense_added',
  actor: actorName,
  description: description.trim(),
  currency: group?.currency ?? '',
  amount: amount.toFixed(2),
}
```

---

## 5. Settle action — `src/app/[lang]/(app)/groups/[id]/settle/actions.ts`

Current message (line 29): `` `${fromName} paid ${toName} ${amount.toFixed(2)}` ``

Add `messageParams`:
```ts
messageParams: {
  key: 'msg_settlement_paid',
  from: fromName,
  to: toName,
  amount: amount.toFixed(2),
}
```

---

## 6. Members action — `src/app/[lang]/(app)/groups/[id]/members/actions.ts`

Four message branches:

- **Re-added (you)** → `msg_member_readded_you` with `{ actor: currentUser.displayName, group: group.name }`
- **Re-added (other)** → `msg_member_readded_other` with `{ name: existing.displayName, group: group.name }`
- **Added (invitee)** → `msg_member_added_you` with `{ actor: currentUser.displayName, group: group.name }`
- **Added (actor)** → `msg_member_added_other` with `{ name: inviteeName, group: group.name }`
- **Renamed (self)** → `msg_member_renamed_self` with `{ from: existing.displayName, to: newName }`
- **Renamed (other)** → `msg_member_renamed_other` with `{ actor: user.displayName, from: existing.displayName, to: newName }`

Each branch already sets `message` — add `messageParams` alongside it using the matching key.

---

## 7. Join action — `src/app/[lang]/join/[token]/actions.ts`

Current message (lines 39, 52): `` `${user.displayName} joined "${group.name}"` ``

Add `messageParams`:
```ts
messageParams: {
  key: 'msg_member_joined',
  name: user.displayName,
  group: group.name,
}
```

---

## 8. Notifications page — `src/app/[lang]/(app)/notifications/page.tsx`

Replace the verbatim `n.message` render (line 96) with a helper that generates the localized string:

```ts
const body = n.messageParams?.key
  ? t(n.messageParams.key, n.messageParams)
  : n.message
```

Then render `{body}` instead of `{n.message}`.

No structural JSX changes needed — only this one line.

---

## Critical files

| File | Action |
|---|---|
| `src/db/schema/notifications.ts` | Modify — add `messageParams` jsonb column |
| `src/messages/en.json` | Modify — add 9 `msg_*` keys to `activity` namespace |
| `src/messages/vi.json` | Modify — add 9 `msg_*` keys to `activity` namespace |
| `src/db/mutations/expenses.ts` | Modify — accept `messageParams` in row type |
| `src/db/mutations/settlements.ts` | Modify — accept `messageParams` in row type |
| `src/db/mutations/group-members.ts` | Modify — accept `messageParams` in row type |
| `src/app/[lang]/(app)/groups/[id]/expenses/new/actions.ts` | Modify — pass `messageParams` when building notification rows |
| `src/app/[lang]/(app)/groups/[id]/settle/actions.ts` | Modify — pass `messageParams` |
| `src/app/[lang]/(app)/groups/[id]/members/actions.ts` | Modify — pass `messageParams` for all 6 branches |
| `src/app/[lang]/join/[token]/actions.ts` | Modify — pass `messageParams` |
| `src/app/[lang]/(app)/notifications/page.tsx` | Modify — render from `messageParams` with i18n fallback |

---

## Verification

1. `npx drizzle-kit push` — schema change applied without errors
2. `npm run build` — must pass with no type errors
3. `npm run lint` — must be clean
4. Trigger an expense, settlement, and member action in the UI
5. Switch locale to Vietnamese — new notifications show Vietnamese content; old notifications fall back to stored English string
6. `npm run test:e2e` — create/update E2E tests to assert notification content matches the active locale
