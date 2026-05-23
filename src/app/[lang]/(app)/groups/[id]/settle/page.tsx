import { notFound } from 'next/navigation'
import { db } from '@/db'
import { groups, groupMembers, expenses, expenseSplits, settlements } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { calculateBalances, minimizeDebts } from '@/lib/balance'
import { hasLocale } from '@/lib/i18n'
import { SettleForm } from './settle-form'

export default async function SettlePage({ params, searchParams }: PageProps) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()
  await verifyGroupMembership(id, user.id)

  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
  if (!group) notFound()

  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, id))

  const activeMembers = members.filter((m) => m.isActive)

  const groupExpenses = await db.select().from(expenses).where(eq(expenses.groupId, id))
  const expenseIds = groupExpenses.map((e) => e.id)
  const allSplits = expenseIds.length ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds)) : []

  const groupSettlements = await db.select().from(settlements).where(eq(settlements.groupId, id))

  const expensesWithSplits = groupExpenses.map((e) => ({
    paidBy: e.paidBy,
    splits: allSplits.filter((s) => s.expenseId === e.id).map((s) => ({ memberId: s.memberId, shareAmount: s.shareAmount })),
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

  const debts = minimizeDebts(balances)

  const sp = await searchParams
  const fromParam = sp?.from as string | undefined
  const toParam = sp?.to as string | undefined

  let suggestedDebt: { from: string; to: string; amount: number } | null = null

  if (fromParam && toParam) {
    const match = debts.find((d) => d.from.memberId === fromParam && d.to.memberId === toParam)
    if (match)
      suggestedDebt = {
        from: match.from.memberId,
        to: match.to.memberId,
        amount: match.amount,
      }
  } else if (debts.length > 0) {
    const d = debts[0]
    suggestedDebt = {
      from: d.from.memberId,
      to: d.to.memberId,
      amount: d.amount,
    }
  }

  return (
    <SettleForm
      groupId={id}
      currency={group.currency}
      members={activeMembers.map((m) => ({
        id: m.id,
        displayName: m.displayName,
      }))}
      suggestedDebt={suggestedDebt}
    />
  )
}
