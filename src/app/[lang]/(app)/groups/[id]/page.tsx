import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { minimizeDebts } from '@/lib/balance'
import { AppCalculations } from '@/lib/app-calculations'
import { hasLocale } from '@/lib/i18n'
import { GroupDetailClient } from './group-detail-client'
import { getGroupDetailData } from '@/db/queries/groups'

export default async function GroupDetailPage({ params }: PageProps) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()
  await verifyGroupMembership(id, user.id)

  const { group, allMembers, groupExpenses, deletedExpenses, groupSettlements, allSplitsForGroup, userDataById } =
    await getGroupDetailData(id)

  if (!group) notFound()

  const myMember = allMembers.find((m) => m.userId === user.id)

  const activeMembers = allMembers.filter((m) => m.isActive)

  const mappedSettlements = groupSettlements.map((s) => ({
    fromMember: s.fromMember,
    toMember: s.toMember,
    amount: s.amount,
  }))

  const expenseBalances = AppCalculations.calculateGroupBalances(
    activeMembers.map((m) => ({ id: m.id, displayName: m.displayName })),
    groupExpenses.map((e) => ({ id: e.id, paidBy: e.paidBy })),
    allSplitsForGroup,
  )

  const balances = AppCalculations.applySettlements(expenseBalances, mappedSettlements)
  const minimizedDebts = minimizeDebts(expenseBalances, mappedSettlements)
  const myBalance = AppCalculations.getMyBalance(balances, myMember?.id)

  const serializedExpenses = groupExpenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    category: e.category,
    date: e.date,
    paidBy: e.paidBy,
    createdAt: e.createdAt.toISOString(),
    isTransfer: e.isTransfer,
  }))

  const serializedDeletedExpenses = deletedExpenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    category: e.category,
    deletedAt: e.deletedAt!.toISOString(),
    deletedBy: e.deletedBy ?? null,
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
    avatarUrl: m.userId ? (userDataById.get(m.userId)?.avatarUrl ?? null) : null,
  }))

  const serializedAllMembers = allMembers.map((m) => {
    const userData = m.userId ? userDataById.get(m.userId) : undefined
    return {
      id: m.id,
      displayName: m.displayName,
      userId: m.userId,
      defaultShare: m.defaultShare,
      isActive: m.isActive,
      createdAt: m.createdAt.toISOString(),
      avatarUrl: userData?.avatarUrl ?? null,
      userEmail: userData?.email ?? null,
      userName: userData?.userName ?? null,
    }
  })

  return (
    <GroupDetailClient
      group={{
        id: group.id,
        name: group.name,
        currency: group.currency,
        isPublic: group.isPublic,
        inviteToken: group.inviteToken ?? null,
        imageUrl: group.imageUrl ?? null,
        createdAt: group.createdAt.toISOString(),
      }}
      allMembers={serializedAllMembers}
      members={serializedMembers}
      expenses={serializedExpenses}
      splits={allSplitsForGroup.map((s) => ({
        expenseId: s.expenseId,
        memberId: s.memberId,
        shareAmount: s.shareAmount,
      }))}
      deletedExpenses={serializedDeletedExpenses}
      settlements={serializedSettlements}
      balances={balances}
      minimizedDebts={minimizedDebts}
      myMemberId={myMember?.id ?? null}
      myBalance={myBalance}
    />
  )
}
