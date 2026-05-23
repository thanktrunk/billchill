import { notFound } from 'next/navigation'
import { db } from '@/db'
import { groups, groupMembers, expenses, expenseSplits, settlements, users } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { calculateBalances, minimizeDebts } from '@/lib/balance'
import { hasLocale } from '@/lib/i18n'
import { GroupDetailClient } from './group-detail-client'

export default async function GroupDetailPage({ params }: PageProps) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()
  await verifyGroupMembership(id, user.id)

  const [group, allMembers, groupExpenses, groupSettlements] = await Promise.all([
    db.query.groups.findFirst({ where: eq(groups.id, id) }),
    db.select().from(groupMembers).where(eq(groupMembers.groupId, id)),
    db.select().from(expenses).where(eq(expenses.groupId, id)),
    db.select().from(settlements).where(eq(settlements.groupId, id)),
  ])

  if (!group) notFound()

  const myMember = allMembers.find((m) => m.userId === user.id)

  const memberUserIds = allMembers.map((m) => m.userId).filter(Boolean) as string[]
  const memberUsers = memberUserIds.length
    ? await db.select({ id: users.id, avatarUrl: users.avatarUrl }).from(users).where(inArray(users.id, memberUserIds))
    : []
  const avatarByUserId = new Map(memberUsers.map((u) => [u.id, u.avatarUrl]))

  const expenseIds = groupExpenses.map((e) => e.id)
  const allSplitsForGroup = expenseIds.length
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
    : []

  const activeMembers = allMembers.filter((m) => m.isActive)

  const expensesWithSplits = groupExpenses.map((e) => ({
    paidBy: e.paidBy,
    splits: allSplitsForGroup.filter((s) => s.expenseId === e.id).map((s) => ({ memberId: s.memberId, shareAmount: s.shareAmount })),
  }))

  const balances = calculateBalances(
    activeMembers.map((m) => ({ id: m.id, displayName: m.displayName })),
    expensesWithSplits,
    groupSettlements.map((s) => ({
      fromMember: s.fromMember,
      toMember: s.toMember,
      amount: s.amount,
    })),
  )

  const minimizedDebts = minimizeDebts(balances)
  const myBalance = myMember ? (balances.find((b) => b.memberId === myMember.id)?.balance ?? 0) : 0

  const serializedExpenses = groupExpenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    category: e.category,
    date: e.date,
    paidBy: e.paidBy,
    createdAt: e.createdAt.toISOString(),
  }))

  const serializedSettlements = groupSettlements.map((s) => ({
    id: s.id,
    fromMember: s.fromMember,
    toMember: s.toMember,
    amount: s.amount,
    settledAt: s.settledAt.toISOString(),
  }))

  const serializedMembers = activeMembers.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    userId: m.userId,
    avatarUrl: m.userId ? (avatarByUserId.get(m.userId) ?? null) : null,
  }))

  const serializedAllMembers = allMembers.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    userId: m.userId,
    defaultShare: m.defaultShare,
    isActive: m.isActive,
    avatarUrl: m.userId ? (avatarByUserId.get(m.userId) ?? null) : null,
  }))

  return (
    <GroupDetailClient
      group={{
        id: group.id,
        name: group.name,
        currency: group.currency,
      }}
      allMembers={serializedAllMembers}
      members={serializedMembers}
      expenses={serializedExpenses}
      splits={allSplitsForGroup.map((s) => ({
        expenseId: s.expenseId,
        memberId: s.memberId,
        shareAmount: s.shareAmount,
      }))}
      settlements={serializedSettlements}
      balances={balances}
      minimizedDebts={minimizedDebts}
      myMemberId={myMember?.id ?? null}
      myBalance={myBalance}
    />
  )
}
