import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { groups, groupMembers } from './groups'

export const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id')
    .references(() => groups.id, { onDelete: 'cascade' })
    .notNull(),
  fromMember: uuid('from_member')
    .references(() => groupMembers.id)
    .notNull(),
  toMember: uuid('to_member')
    .references(() => groupMembers.id)
    .notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  settledAt: timestamp('settled_at').defaultNow().notNull(),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
})
