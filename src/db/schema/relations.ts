import { relations } from 'drizzle-orm'
import { users } from './users'
import { groups, groupMembers } from './groups'
import { expenses, expenseSplits } from './expenses'
import { settlements } from './settlements'
import { notifications } from './notifications'

export const usersRelations = relations(users, ({ many }) => ({
  groupMembers: many(groupMembers),
  notifications: many(notifications),
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
}))

export const groupMembersRelations = relations(groupMembers, ({ one, many }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
  expensesPaid: many(expenses),
  splits: many(expenseSplits),
}))

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  paidByMember: one(groupMembers, {
    fields: [expenses.paidBy],
    references: [groupMembers.id],
  }),
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
  splits: many(expenseSplits),
}))

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  member: one(groupMembers, {
    fields: [expenseSplits.memberId],
    references: [groupMembers.id],
  }),
}))

export const settlementsRelations = relations(settlements, ({ one }) => ({
  group: one(groups, {
    fields: [settlements.groupId],
    references: [groups.id],
  }),
  fromMemberRef: one(groupMembers, {
    fields: [settlements.fromMember],
    references: [groupMembers.id],
    relationName: 'settlementFrom',
  }),
  toMemberRef: one(groupMembers, {
    fields: [settlements.toMember],
    references: [groupMembers.id],
    relationName: 'settlementTo',
  }),
  createdByUser: one(users, {
    fields: [settlements.createdBy],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  group: one(groups, {
    fields: [notifications.groupId],
    references: [groups.id],
  }),
}))
