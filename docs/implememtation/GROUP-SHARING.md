# Plan: Group Sharing with Public/Private Access Control

## Context
Groups currently have no visibility concept — all access is controlled by `verifyGroupMembership()`. The user wants:
- A **private** mode (default): only existing members can add new members (current behaviour)
- A **public** mode: group owner can generate a shareable invite link; anyone who opens the link can click "Join"
- The toggle and link-copy UI live in the group settings tab

---

## 1. Schema changes — `src/db/schema/groups.ts`

Add two columns to the `groups` table:

```ts
isPublic: boolean('is_public').notNull().default(false),
inviteToken: varchar('invite_token', { length: 64 }).unique(),
```

`inviteToken` is a random UUID generated when the group is made public; cleared when made private.

Run `npx drizzle-kit push` to apply (no migration file needed in dev).

---

## 2. DB mutations — `src/db/mutations/groups.ts`

Add:
- `updateGroupVisibility(groupId, isPublic, token)` — sets `isPublic` + `inviteToken`
- `findGroupByInviteToken(token)` — returns group row (id, name, currency, isPublic, inviteToken)

---

## 3. DB queries — `src/db/queries/groups.ts`

Add:
- `getJoinPageData(token)` — returns `{ group, memberCount }` for the join landing page

Extend `getGroupDetailData` to include `isPublic` and `inviteToken` in the returned group object so settings-tab can read them.

---

## 4. Group settings server action — `src/app/[lang]/(app)/groups/[id]/settings/actions.ts`

Add `updateGroupVisibility(groupId, isPublic)`:
1. `requireUser()` + `verifyGroupMembership()`
2. If `isPublic=true`, generate a `crypto.randomUUID()` token (only if not already set)
3. Call `updateGroupVisibility` mutation
4. `revalidatePath`

---

## 5. Settings tab UI — `src/app/[lang]/(app)/groups/[id]/_components/settings-tab.tsx`

Add below the name/currency section:

- **Visibility toggle** using `BCChip` or a toggle switch labelled "Public group"
  - Private: "Only members can join — add people manually"
  - Public: shows the invite link + Copy button (navigator.clipboard)
- The invite URL is: `${window.location.origin}/{lang}/join/{inviteToken}`
- Toggling calls `updateGroupVisibility` server action

The `group` prop needs to carry `isPublic` and `inviteToken` — update the type passed from `group-detail-client.tsx` → page.

---

## 6. Join landing page — `src/app/[lang]/join/[token]/page.tsx`

New **server component** (outside the `(app)` route group so it doesn't inherit the app layout):

1. Call `getJoinPageData(token)` — if not found or group is private → 404
2. `getCurrentUser()` — may be null
3. Render: group name, member count, "Join group" button
   - If user is null: "Join group" links to `/auth/login?returnTo=/[lang]/join/[token]`
   - If user is already a member: show "You're already a member" 
   - Otherwise: show `<JoinButton>` client component that calls `joinGroupByToken`

---

## 7. Join server action — `src/app/[lang]/join/[token]/actions.ts`

`joinGroupByToken(lang, token)`:
1. `requireUser()`
2. Fetch group by token; throw if not found or `isPublic=false`
3. Check user is not already an active member
4. If inactive member exists → `reactivateGroupMember`; else `createGroupMember`
5. Create `member_added` notification
6. `redirect(\`/${lang}/groups/${group.id}\`)`

---

## 8. Middleware — `src/proxy.ts`

Allow `/[lang]/join/*` to render without an active Auth0 session (so non-logged-in users can see the join page before being redirected to login):

```ts
// In the auth-guard section, add:
const isJoinRoute = /^\/[a-z]{2}\/join\//.test(pathname)
if (!session && !isJoinRoute) {
  return NextResponse.redirect(loginUrl)
}
```

---

## 9. i18n — dictionary files (`src/dictionaries/`)

Add keys under `group` namespace (en + other langs):
```json
"visibility_public": "Public",
"visibility_private": "Private",
"visibility_hint_public": "Anyone with the link can join",
"visibility_hint_private": "Add members manually",
"copy_link": "Copy link",
"link_copied": "Copied!",
"join_group": "Join group",
"join_already_member": "You're already a member",
"join_page_member_count": "{count} members"
```

---

## Critical files

| File | Action |
|---|---|
| `src/db/schema/groups.ts` | Add `isPublic`, `inviteToken` columns |
| `src/db/mutations/groups.ts` | Add `updateGroupVisibility`, `findGroupByInviteToken` |
| `src/db/queries/groups.ts` | Extend `getGroupDetailData`, add `getJoinPageData` |
| `src/app/[lang]/(app)/groups/[id]/settings/actions.ts` | Add `updateGroupVisibility` action |
| `src/app/[lang]/(app)/groups/[id]/_components/settings-tab.tsx` | Add visibility toggle + share link UI |
| `src/app/[lang]/(app)/groups/[id]/group-detail-client.tsx` | Pass `isPublic`+`inviteToken` through |
| `src/app/[lang]/join/[token]/page.tsx` | New join landing page |
| `src/app/[lang]/join/[token]/actions.ts` | New `joinGroupByToken` action |
| `src/proxy.ts` | Allow `/join/*` without auth |
| `src/dictionaries/en.json` (+ others) | Add i18n keys |

---

## Verification

1. `npx drizzle-kit push` — confirms schema applies cleanly
2. Toggle group to Public in settings → link appears, can copy it
3. Open link in incognito → redirects to login, then back to join page
4. Click Join → lands on group detail as member
5. Open link as existing member → "already a member" state
6. Toggle back to Private → link disappears; old token URL returns 404
7. `npm run build` passes, `npm run lint` clean
