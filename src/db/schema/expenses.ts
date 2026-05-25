import { pgTable, uuid, varchar, numeric, timestamp, date, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'
import { groups, groupMembers } from './groups'

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id')
    .references(() => groups.id, { onDelete: 'cascade' })
    .notNull(),
  paidBy: uuid('paid_by')
    .references(() => groupMembers.id)
    .notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  category: varchar('category', { length: 100 }),
  date: date('date').notNull(),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by').references(() => groupMembers.id),
  isTransfer: boolean('is_transfer').notNull().default(false),
})

export const expenseSplits = pgTable('expense_splits', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseId: uuid('expense_id')
    .references(() => expenses.id, { onDelete: 'cascade' })
    .notNull(),
  memberId: uuid('member_id')
    .references(() => groupMembers.id)
    .notNull(),
  shareAmount: numeric('share_amount', { precision: 12, scale: 2 }).notNull(),
})
