import { and, count, eq, inArray, isNull, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { expenseSplits, expenses, groupMembers, groups, settlements, users } from '@/db/schema'

export async function getJoinPageData(token: string) {
  const group = await db.query.groups.findFirst({ where: eq(groups.inviteToken, token) })
  if (!group || !group.isPublic || group.archivedAt) return null

  const [[{ value: memberCount }], ghostMembers] = await Promise.all([
    db
      .select({ value: count() })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.isActive, true))),
    db
      .select({ id: groupMembers.id, displayName: groupMembers.displayName })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.isActive, true), isNull(groupMembers.userId))),
  ])

  return { group, memberCount, ghostMembers }
}

export async function getGroupListDataForUser(userId: string) {
  const myMemberships = await db
    .select({ groupId: groupMembers.groupId, myMemberId: groupMembers.id, starredAt: groupMembers.starredAt })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId))

  const groupIds = myMemberships.map((membership) => membership.groupId)

  if (!groupIds.length) {
    return {
      myMemberships,
      allGroups: [],
      allMembers: [],
      allExpenses: [],
      allSettlements: [],
      allSplits: [],
    }
  }

  const [allGroups, allMembers, allExpenses, allSettlements] = await Promise.all([
    db.select().from(groups).where(inArray(groups.id, groupIds)),
    db
      .select()
      .from(groupMembers)
      .where(and(inArray(groupMembers.groupId, groupIds), eq(groupMembers.isActive, true))),
    db
      .select()
      .from(expenses)
      .where(and(inArray(expenses.groupId, groupIds), isNull(expenses.deletedAt))),
    db.select().from(settlements).where(inArray(settlements.groupId, groupIds)),
  ])

  const expenseIds = allExpenses.map((expense) => expense.id)
  const allSplits = expenseIds.length ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds)) : []

  return {
    myMemberships,
    allGroups,
    allMembers,
    allExpenses,
    allSettlements,
    allSplits,
  }
}

export async function getGroupDetailData(groupId: string) {
  const [group, allMembers, groupExpenses, deletedExpenses, groupSettlements] = await Promise.all([
    db.query.groups.findFirst({ where: eq(groups.id, groupId) }),
    db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId)),
    db
      .select()
      .from(expenses)
      .where(and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt))),
    db
      .select()
      .from(expenses)
      .where(and(eq(expenses.groupId, groupId), isNotNull(expenses.deletedAt))),
    db.select().from(settlements).where(eq(settlements.groupId, groupId)),
  ])

  const memberUserIds = allMembers.map((member) => member.userId).filter(Boolean) as string[]
  const memberUsers = memberUserIds.length
    ? await db
        .select({ id: users.id, avatarUrl: users.avatarUrl, email: users.email, displayName: users.displayName })
        .from(users)
        .where(inArray(users.id, memberUserIds))
    : []

  const expenseIds = groupExpenses.map((expense) => expense.id)
  const allSplitsForGroup = expenseIds.length
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
    : []

  return {
    group,
    allMembers,
    groupExpenses,
    deletedExpenses,
    groupSettlements,
    allSplitsForGroup,
    userDataById: new Map(memberUsers.map((u) => [u.id, { avatarUrl: u.avatarUrl, email: u.email, userName: u.displayName }])),
  }
}

export async function getSettlePageData(groupId: string) {
  const group = await db.query.groups.findFirst({ where: eq(groups.id, groupId) })
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId))
  const groupExpenses = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt)))

  const expenseIds = groupExpenses.map((expense) => expense.id)
  const allSplits = expenseIds.length ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds)) : []

  const groupSettlements = await db.select().from(settlements).where(eq(settlements.groupId, groupId))

  return {
    group,
    members,
    groupExpenses,
    allSplits,
    groupSettlements,
  }
}

export async function getNewExpensePageData(groupId: string) {
  const [group, members] = await Promise.all([
    db.query.groups.findFirst({ where: eq(groups.id, groupId) }),
    db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        displayName: groupMembers.displayName,
        defaultShare: groupMembers.defaultShare,
        avatarUrl: users.avatarUrl,
      })
      .from(groupMembers)
      .leftJoin(users, eq(groupMembers.userId, users.id))
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true))),
  ])

  return {
    group,
    members,
  }
}

export async function getActiveMembersByGroupId(groupId: string) {
  return db
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
      displayName: groupMembers.displayName,
      defaultShare: groupMembers.defaultShare,
      avatarUrl: users.avatarUrl,
    })
    .from(groupMembers)
    .leftJoin(users, eq(groupMembers.userId, users.id))
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true)))
}
