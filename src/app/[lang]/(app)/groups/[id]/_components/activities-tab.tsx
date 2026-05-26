'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BCCard, BCSectionLabel, BCCategoryBadge, BCIcon, BCChip } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/currency'
import { AppCalculations } from '@/lib/app-calculations'

type Member = { id: string; displayName: string; userId: string | null; avatarUrl?: string | null }
type ActivityMember = { id: string; displayName: string; createdAt: string; isActive: boolean }
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
type DeletedExpense = {
  id: string
  description: string
  amount: string
  currency: string
  category: string | null
  deletedAt: string
  deletedBy: string | null
}

function formatTime(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

function ExpenseRow({
  expense,
  splits,
  members,
  myMemberId,
}: {
  expense: Expense
  splits: Split[]
  members: Member[]
  myMemberId: string | null
}) {
  const tGroup = useTranslations('group')
  const locale = useLocale()
  const payer = members.find((m) => m.id === expense.paidBy)
  const payerName = payer?.displayName ?? '?'
  const mySplit = splits.find((s) => s.memberId === myMemberId)
  const iPaid = expense.paidBy === myMemberId
  const { lent, owe } = AppCalculations.buildExpenseDelta(expense.amount, mySplit?.shareAmount, iPaid)

  return (
    <BCCard padded={false} className="px-3.5 py-3">
      <div className="flex items-center gap-3">
        <BCCategoryBadge category={expense.category ?? 'other'} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-[14.5px] text-(--bc-ink) tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">
            {expense.description}
          </div>
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">
            {formatTime(expense.createdAt, locale)}
            {' · '}
            {tGroup(splits.length === 1 ? 'share_count_one' : 'share_count_other', { 0: splits.length })}
            {' · '}
            {payerName}
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-[22px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.01em]">
            {formatCurrency(expense.amount, expense.currency)}
          </div>
          {(lent > 0.005 || owe > 0.005) && (
            <div className={cn('font-mono text-[11px] mt-0.75 tracking-[0.02em]', iPaid ? 'text-(--bc-pos)' : 'text-(--bc-neg)')}>
              {iPaid ? `+${formatCurrency(lent, expense.currency)}` : `−${formatCurrency(owe, expense.currency)}`}
            </div>
          )}
        </div>
      </div>
    </BCCard>
  )
}

function SettlementRow({ settlement, members, groupCurrency }: { settlement: Settlement; members: Member[]; groupCurrency: string }) {
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
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">{formatTime(settlement.settledAt, locale)}</div>
        </div>
        <div className="font-serif text-[22px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.01em]">
          {formatCurrency(settlement.amount, groupCurrency)}
        </div>
      </div>
    </BCCard>
  )
}

function MemberJoinedRow({ member }: { member: ActivityMember }) {
  const tGroup = useTranslations('group')
  const locale = useLocale()
  return (
    <BCCard padded={false} className="px-3.5 py-3 bg-(--bc-chip) border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-(--bc-bg) flex items-center justify-center border border-dashed border-(--bc-hair)">
          <BCIcon name="user" size={18} color="var(--bc-ink)" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-[14.5px] text-(--bc-ink)">{member.displayName}</div>
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">
            {formatTime(member.createdAt, locale)}
            {' · '}
            {tGroup('activity_member_joined')}
          </div>
        </div>
      </div>
    </BCCard>
  )
}

function DeletedExpenseRow({ expense, members }: { expense: DeletedExpense; members: Member[] }) {
  const tGroup = useTranslations('group')
  const locale = useLocale()
  const deleter = expense.deletedBy ? members.find((m) => m.id === expense.deletedBy) : null
  return (
    <BCCard padded={false} className="px-3.5 py-3 bg-(--bc-chip) border-0 opacity-60">
      <div className="flex items-center gap-3">
        <BCCategoryBadge category={expense.category ?? 'other'} size={40} />
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-[14.5px] text-(--bc-ink) tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis line-through">
            {expense.description}
          </div>
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">
            {formatTime(expense.deletedAt, locale)}
            {' · '}
            {deleter ? tGroup('activity_expense_deleted_by', { 0: deleter.displayName }) : tGroup('activity_expense_deleted')}
          </div>
        </div>
        <div className="font-serif text-[22px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.01em] line-through">
          {formatCurrency(expense.amount, expense.currency)}
        </div>
      </div>
    </BCCard>
  )
}

function GroupCreatedRow({ ts }: { ts: string }) {
  const tGroup = useTranslations('group')
  const locale = useLocale()
  return (
    <BCCard padded={false} className="px-3.5 py-3 bg-(--bc-chip) border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-(--bc-bg) flex items-center justify-center border border-dashed border-(--bc-hair)">
          <BCIcon name="activity" size={18} color="var(--bc-ink)" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-[14.5px] text-(--bc-ink)">{tGroup('activity_group_created')}</div>
          <div className="font-sans text-xs text-(--bc-muted) mt-0.5">{formatTime(ts, locale)}</div>
        </div>
      </div>
    </BCCard>
  )
}

export function ActivitiesTab({
  expenses,
  deletedExpenses,
  splits,
  settlements,
  members,
  allMembers,
  myMemberId,
  groupCurrency,
  groupId,
  groupCreatedAt,
}: {
  expenses: Expense[]
  deletedExpenses: DeletedExpense[]
  splits: Split[]
  settlements: Settlement[]
  members: Member[]
  allMembers: ActivityMember[]
  myMemberId: string | null
  groupCurrency: string
  groupId: string
  groupCreatedAt: string
}) {
  const locale = useLocale()
  const tGroup = useTranslations('group')
  const [filter, setFilter] = useState<'all' | 'expenses' | 'settlements' | 'system'>('expenses')

  type TimelineItem =
    | { kind: 'expense'; e: Expense; ts: string }
    | { kind: 'expense_deleted'; d: DeletedExpense; ts: string }
    | { kind: 'settlement'; s: Settlement; ts: string }
    | { kind: 'member_joined'; m: ActivityMember; ts: string }
    | { kind: 'group_created'; ts: string }

  const items: TimelineItem[] = [
    ...expenses.map((e) => ({ kind: 'expense' as const, e, ts: e.createdAt })),
    ...deletedExpenses.map((d) => ({ kind: 'expense_deleted' as const, d, ts: d.deletedAt })),
    ...settlements.map((s) => ({ kind: 'settlement' as const, s, ts: s.settledAt })),
    ...allMembers.map((m) => ({ kind: 'member_joined' as const, m, ts: m.createdAt })),
    { kind: 'group_created' as const, ts: groupCreatedAt },
  ].sort((a, b) => b.ts.localeCompare(a.ts))

  const filteredItems = items.filter((it) => {
    if (filter === 'expenses') return it.kind === 'expense'
    if (filter === 'settlements') return it.kind === 'settlement'
    if (filter === 'system') return it.kind === 'expense_deleted' || it.kind === 'member_joined' || it.kind === 'group_created'
    return true
  })

  const dayGroups: { day: string; items: TimelineItem[] }[] = []
  filteredItems.forEach((it) => {
    const day = it.ts.slice(0, 10)
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
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-4 px-4">
        <BCChip active={filter === 'all'} onClick={() => setFilter('all')}>
          {tGroup('filter_all')}
        </BCChip>
        <BCChip active={filter === 'expenses'} onClick={() => setFilter('expenses')}>
          {tGroup('filter_expenses')}
        </BCChip>
        <BCChip active={filter === 'settlements'} onClick={() => setFilter('settlements')}>
          {tGroup('filter_settlements')}
        </BCChip>
        <BCChip active={filter === 'system'} onClick={() => setFilter('system')}>
          {tGroup('filter_system')}
        </BCChip>
      </div>
      {dayGroups.map((grp) => (
        <div key={grp.day}>
          <div className="px-1 pb-2 flex items-center gap-2.5">
            <BCSectionLabel>{formatDate(grp.day, locale)}</BCSectionLabel>
            <div className="flex-1 h-px bg-(--bc-softhair)" />
          </div>
          <div className="flex flex-col gap-2">
            {grp.items.map((it, i) => {
              if (it.kind === 'expense') {
                return (
                  <Link key={it.e.id} href={`/${locale}/groups/${groupId}/expenses/${it.e.id}`} className="no-underline">
                    <ExpenseRow expense={it.e} splits={splitsByExpense.get(it.e.id) ?? []} members={members} myMemberId={myMemberId} />
                  </Link>
                )
              }
              if (it.kind === 'expense_deleted') {
                return <DeletedExpenseRow key={it.d.id} expense={it.d} members={members} />
              }
              if (it.kind === 'settlement') {
                return <SettlementRow key={it.s.id} settlement={it.s} members={members} groupCurrency={groupCurrency} />
              }
              if (it.kind === 'member_joined') {
                return <MemberJoinedRow key={it.m.id} member={it.m} />
              }
              return <GroupCreatedRow key={`group_created_${i}`} ts={it.ts} />
            })}
          </div>
        </div>
      ))}
      {filteredItems.length === 0 && <div className="px-5 py-10 text-center text-(--bc-muted) font-sans">{tGroup('no_activities')}</div>}
    </div>
  )
}
