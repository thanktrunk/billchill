# BillChill — Requirements

## Overview

A mobile-first web app for splitting group expenses, similar to SettleUp. Users create groups, add members, log expenses, track balances, and record settlements.

---

## Functional Requirements

### Authentication
- Users sign in via Auth0 (social or email/password).
- On first login, a user profile is created automatically.
- All app routes are protected — unauthenticated users are redirected to login.

### Groups
- A user can create a group with a name and default currency.
- A user can view all groups they belong to (archived groups are hidden).
- A group has a detail view with four tabs: Expenses, Balances, Members, Settings.
- A group can be archived from the Settings tab; archived groups no longer appear in the list.
- Group name and currency can be edited from the Settings tab.

### Members
- A group member can invite others by email from the Members tab.
  - If the invitee has an account, their `user_id` is linked.
  - If not, a placeholder member (display name only, no `user_id`) is created.
- Members have a `display_name`, a `default_share` weight, and an `is_active` flag.
- Member `display_name` and `default_share` can be edited inline from the Members tab.
- A member can be deactivated (removed from active splits) or reactivated.

### Expenses
- Any group member can add an expense with:
  - Payer (who paid)
  - Amount and currency
  - Description, category, and date
  - Split method (see below)
- Expenses are listed in the group's Expenses tab, grouped by day.
- An expense can be tapped to view its detail, including the full split breakdown.
- An expense can be edited (description, payer, category, split amounts) or deleted from the detail view.

#### Split Methods
| Method | Behaviour |
|---|---|
| Equal | Amount divided equally among selected members |
| By amount | Explicit amount assigned to each member; must sum to total |
| By shares | Amount distributed proportionally to each member's share weight |
| By percentage | Each member assigned a percentage of the total; must sum to 100% |

- Split amounts must sum to the expense total.

### Balances
- Each group shows the net balance per member:
  - Positive → owed money back
  - Negative → owes money
- A minimized list of transactions (settle-up suggestions) is shown to clear all debts with the fewest payments.

### Settlements
- A member can record a settlement (person A pays person B an amount).
- Past settlements are listed in the group's Expenses tab timeline.
- Settlements are factored into the current balance calculation.

### Notifications
- In-app notifications are created when:
  - An expense is added to a group you belong to
  - A settlement is recorded in a group you belong to
  - You create a group (member_added confirmation)
- The Activity tab in the bottom nav shows an unread count badge.
- A notifications page lists all notifications sorted by date; each links to the relevant group.
- All notifications can be marked as read at once via the check button on the notifications page.

---

## Non-Functional Requirements

- **Mobile-first** — UI designed for phone browsers; responsive for desktop.
- **Performance** — Independent DB queries are parallelized; data is pre-indexed before render loops.
- **Accessibility** — Standard semantic HTML and keyboard navigation.
- **Error handling** — Loading skeletons during data fetches; toast notifications for action outcomes.

---

## Out of Scope (MVP)

- Multi-currency conversion
- Recurring expenses
- Payment integrations (Venmo, PayPal, etc.)
- Receipt photo uploads
- Real-time / live updates
- Expense list sorting and filtering by member
- Per-notification mark-as-read (only mark-all is supported)
