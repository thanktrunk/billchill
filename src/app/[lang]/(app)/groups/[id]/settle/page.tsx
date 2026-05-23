import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { minimizeDebts } from '@/lib/balance'
import { AppCalculations } from '@/lib/app-calculations'
import { hasLocale } from '@/lib/i18n'
import { SettleForm } from './settle-form'
import { getSettlePageData } from '@/db/queries/groups'

export default async function SettlePage({ params, searchParams }: PageProps) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()
  await verifyGroupMembership(id, user.id)

  const { group, members, groupExpenses, allSplits, groupSettlements } = await getSettlePageData(id)
  if (!group) notFound()

  const activeMembers = members.filter((m) => m.isActive)

  const balances = AppCalculations.calculateGroupBalances(
    activeMembers.map((m) => ({ id: m.id, displayName: m.displayName })),
    groupExpenses.map((e) => ({ id: e.id, paidBy: e.paidBy })),
    allSplits,
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
