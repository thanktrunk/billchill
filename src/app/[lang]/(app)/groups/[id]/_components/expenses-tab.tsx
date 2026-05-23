'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BCCard, BCSectionLabel, BCCategoryBadge, BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'

type Member = { id: string; displayName: string; userId: string | null; avatarUrl?: string | null }
type Expense = {
  id: string
  description: string
  amount: string
  currency: string
  category: string | null
  date: string
  paidBy: string
  createdAt: string
}
type Split = { expenseId: string; memberId: string; shareAmount: string }
type Settlement = { id: string; fromMember: string; toMember: string; amount: string; settledAt: string }

function shortDate(iso: string, lang: string) {
  const t = new Date(iso)
  return t.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })
}

function ExpenseRow({
  expense,
  splits,
  members,
  myMemberId,
  sym,
}: {
  expense: Expense
  splits: Split[]
  members: Member[]
  myMemberId: string | null
  sym: string
}) {
  const tGroup = useTranslations('group')
  const payer = members.find((m) => m.id === expense.paidBy)
  const payerName = payer?.displayName ?? '?'
  const mySplit = splits.find((s) => s.memberId === myMemberId)
  const iPaid = expense.paidBy === myMemberId
  const amount = parseFloat(expense.amount)
  const myShare = parseFloat(mySplit?.shareAmount ?? '0')
  const lent = iPaid ? amount - myShare : 0
  const owe = !iPaid ? myShare : 0

  return (
    <BCCard padded={false} className="px-3.5 py-3">
      <div className="flex items-center gap-3">
        <BCCategoryBadge category={expense.category ?? 'other'} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-[14.5px] text-(--bc-ink) tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">
            {expense.description}
          </div>
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">
            {tGroup(splits.length === 1 ? 'paid_shares_one' : 'paid_shares_other', { 0: payerName, 1: splits.length })}
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-[22px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.01em]">
            {sym}
            {amount.toFixed(2)}
          </div>
          {(lent > 0.005 || owe > 0.005) && (
            <div className={cn('font-mono text-[11px] mt-0.75 tracking-[0.02em]', iPaid ? 'text-(--bc-pos)' : 'text-(--bc-neg)')}>
              {iPaid ? `+${sym}${lent.toFixed(2)}` : `−${sym}${owe.toFixed(2)}`}
            </div>
          )}
        </div>
      </div>
    </BCCard>
  )
}

function SettlementRow({ settlement, members, sym }: { settlement: Settlement; members: Member[]; sym: string }) {
  const locale = useLocale()
  const tGroup = useTranslations('group')
  const from = members.find((m) => m.id === settlement.fromMember)
  const to = members.find((m) => m.id === settlement.toMember)
  return (
    <BCCard padded={false} className="px-3.5 py-3 bg-(--bc-chip) border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-(--bc-bg) flex items-center justify-center border border-dashed border-(--bc-hair)">
          <BCIcon name="check" size={18} color="var(--bc-ink)" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-[14.5px] text-(--bc-ink)">
            {tGroup('paid_to', { 0: from?.displayName ?? '?', 1: to?.displayName ?? '?' })}
          </div>
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">
            {tGroup('settlement_date', { 0: shortDate(settlement.settledAt, locale) })}
          </div>
        </div>
        <div className="font-serif text-[22px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.01em]">
          {sym}
          {parseFloat(settlement.amount).toFixed(2)}
        </div>
      </div>
    </BCCard>
  )
}

export function ExpensesTab({
  expenses,
  splits,
  settlements,
  members,
  myMemberId,
  sym,
  groupId,
}: {
  expenses: Expense[]
  splits: Split[]
  settlements: Settlement[]
  members: Member[]
  myMemberId: string | null
  sym: string
  groupId: string
}) {
  const locale = useLocale()
  const tGroup = useTranslations('group')

  const expensesSorted = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const settlementsSorted = [...settlements].sort((a, b) => b.settledAt.localeCompare(a.settledAt))

  const items: Array<{ kind: 'expense'; e: Expense } | { kind: 'settlement'; s: Settlement }> = [
    ...expensesSorted.map((e) => ({ kind: 'expense' as const, e })),
    ...settlementsSorted.map((s) => ({ kind: 'settlement' as const, s })),
  ].sort((a, b) => {
    const ta = a.kind === 'expense' ? a.e.createdAt : a.s.settledAt
    const tb = b.kind === 'expense' ? b.e.createdAt : b.s.settledAt
    return tb.localeCompare(ta)
  })

  const dayGroups: { day: string; items: typeof items }[] = []
  items.forEach((it) => {
    const day = (it.kind === 'expense' ? it.e.createdAt : it.s.settledAt).slice(0, 10)
    const last = dayGroups[dayGroups.length - 1]
    if (last && last.day === day) last.items.push(it)
    else dayGroups.push({ day, items: [it] })
  })

  const splitsByExpense = new Map<string, Split[]>()
  for (const s of splits) {
    const arr = splitsByExpense.get(s.expenseId) ?? []
    arr.push(s)
    splitsByExpense.set(s.expenseId, arr)
  }

  return (
    <div className="flex flex-col gap-4.5">
      {dayGroups.map((grp) => (
        <div key={grp.day}>
          <div className="px-1 pb-2 flex items-center gap-2.5">
            <BCSectionLabel>{shortDate(grp.day, locale)}</BCSectionLabel>
            <div className="flex-1 h-px bg-(--bc-softhair)" />
          </div>
          <div className="flex flex-col gap-2">
            {grp.items.map((it) =>
              it.kind === 'expense' ? (
                <Link key={it.e.id} href={`/${locale}/groups/${groupId}/expenses/${it.e.id}`} className="no-underline">
                  <ExpenseRow
                    expense={it.e}
                    splits={splitsByExpense.get(it.e.id) ?? []}
                    members={members}
                    myMemberId={myMemberId}
                    sym={sym}
                  />
                </Link>
              ) : (
                <SettlementRow key={it.s.id} settlement={it.s} members={members} sym={sym} />
              ),
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="px-5 py-10 text-center text-(--bc-muted) font-sans">{tGroup('no_expenses')}</div>}
    </div>
  )
}
