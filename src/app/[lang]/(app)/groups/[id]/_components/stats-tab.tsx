'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { BCCard, BCSectionLabel, BC_CATEGORIES } from '@/components/bc-ui'
import { currencySymbol } from '@/lib/utils'
import { BCDonutChart, BCHorizontalBarChart, BCAreaChart, BCBubbleChart, fmtCurrency } from '@/components/bc-charts'

type Expense = {
  id: string
  description: string
  amount: string
  currency: string
  category: string | null
  date: string
  paidBy: string
}
type Split = { expenseId: string; memberId: string; shareAmount: string }
type Settlement = {
  id: string
  fromMember: string
  toMember: string
  amount: string
  settledAt: string
}
type Balance = { memberId: string; displayName: string; balance: number }
type AllMember = { id: string; displayName: string; isActive: boolean }

export function StatsTab({
  expenses,
  splits,
  allMembers,
  settlements,
  balances,
  currency,
}: {
  expenses: Expense[]
  splits: Split[]
  allMembers: AllMember[]
  settlements: Settlement[]
  balances: Balance[]
  currency: string
}) {
  const tGroup = useTranslations('group')
  const tCat = useTranslations('cat')
  const symbol = currencySymbol(currency)

  const memberById = useMemo(() => new Map(allMembers.map((m) => [m.id, m])), [allMembers])

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of expenses) {
      const key = e.category ?? 'other'
      totals[key] = (totals[key] ?? 0) + parseFloat(e.amount)
    }
    return Object.entries(totals)
      .map(([key, value]) => ({
        key,
        name: tCat(key as keyof typeof tCat),
        value: parseFloat(value.toFixed(2)),
        color: BC_CATEGORIES[key]?.tint ?? '#6B6359',
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, tCat])

  const paidByData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of expenses) {
      totals[e.paidBy] = (totals[e.paidBy] ?? 0) + parseFloat(e.amount)
    }
    return Object.entries(totals)
      .map(([id, value]) => ({
        name: memberById.get(id)?.displayName ?? id,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, memberById])

  const spentByData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const s of splits) {
      totals[s.memberId] = (totals[s.memberId] ?? 0) + parseFloat(s.shareAmount)
    }
    return Object.entries(totals)
      .map(([id, value]) => ({
        name: memberById.get(id)?.displayName ?? id,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
  }, [splits, memberById])

  const timeData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of expenses) {
      const month = e.date.slice(0, 7)
      totals[month] = (totals[month] ?? 0) + parseFloat(e.amount)
    }
    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => {
        const [y, m] = month.split('-')
        const label = new Date(Number(y), Number(m) - 1).toLocaleString(undefined, { month: 'short', year: '2-digit' })
        return { month: label, value: parseFloat(value.toFixed(2)) }
      })
  }, [expenses])

  const topExpenses = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 8)
        .map((e) => ({
          name: e.description || '—',
          value: parseFloat(parseFloat(e.amount).toFixed(2)),
          color: BC_CATEGORIES[e.category ?? 'other']?.tint ?? '#6B6359',
        })),
    [expenses],
  )

  const categoryCountData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of expenses) {
      const key = e.category ?? 'other'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        name: tCat(key as keyof typeof tCat),
        value: count,
        color: BC_CATEGORIES[key]?.tint ?? '#6B6359',
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, tCat])

  const topDebtorsData = useMemo(
    () =>
      balances
        .filter((b) => b.balance < -0.005)
        .map((b) => ({
          name: b.displayName,
          value: parseFloat(Math.abs(b.balance).toFixed(2)),
        }))
        .sort((a, b) => b.value - a.value),
    [balances],
  )

  const settlementProgress = useMemo(() => {
    const settled = settlements.reduce((s, t) => s + parseFloat(t.amount), 0)
    const outstanding = balances.reduce((s, b) => s + (b.balance > 0.005 ? b.balance : 0), 0)
    const total = settled + outstanding
    const pct = total > 0 ? Math.round((settled / total) * 100) : 0
    return {
      settled: parseFloat(settled.toFixed(2)),
      outstanding: parseFloat(outstanding.toFixed(2)),
      pct,
    }
  }, [settlements, balances])

  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-sans text-[14px] text-(--bc-muted)">{tGroup('stats_no_data')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_by_category')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <BCDonutChart data={categoryData} symbol={symbol} />
        </BCCard>
      </div>

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_settlement')}</BCSectionLabel>
        <BCCard padded={false} className="px-4 py-4">
          <div className="flex justify-between items-baseline mb-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.08em]">{tGroup('stats_settled')}</span>
              <span className="font-serif text-[20px] leading-tight tracking-[-0.02em] text-(--bc-pos)">
                {fmtCurrency(settlementProgress.settled, symbol)}
              </span>
            </div>
            <div className="font-serif text-[28px] tracking-[-0.02em] text-(--bc-muted)">{settlementProgress.pct}%</div>
            <div className="flex flex-col gap-0.5 items-end">
              <span className="font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.08em]">{tGroup('stats_outstanding')}</span>
              <span className="font-serif text-[20px] leading-tight tracking-[-0.02em] text-(--bc-neg)">
                {fmtCurrency(settlementProgress.outstanding, symbol)}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-(--bc-chip) overflow-hidden">
            <div
              className="h-full rounded-full bg-(--bc-pos) transition-[width] duration-500"
              style={{ width: `${settlementProgress.pct}%` }}
            />
          </div>
        </BCCard>
      </div>

      {topDebtorsData.length > 0 && (
        <div className="flex flex-col gap-2">
          <BCSectionLabel>{tGroup('stats_top_debtors')}</BCSectionLabel>
          <BCCard padded={false} className="p-4">
            <BCBubbleChart data={topDebtorsData} symbol={symbol} color="--bc-neg" />
          </BCCard>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_spent_by')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <BCBubbleChart data={spentByData} symbol={symbol} />
        </BCCard>
      </div>

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_paid_by')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <BCHorizontalBarChart data={paidByData} symbol={symbol} fill="var(--bc-accent)" />
        </BCCard>
      </div>

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_category_count')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <BCHorizontalBarChart data={categoryCountData} labelMode="count" rightMargin={36} />
        </BCCard>
      </div>

      {timeData.length > 1 && (
        <div className="flex flex-col gap-2">
          <BCSectionLabel>{tGroup('stats_over_time')}</BCSectionLabel>
          <BCCard padded={false} className="p-4">
            <BCAreaChart data={timeData} symbol={symbol} />
          </BCCard>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_top_expenses')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <BCHorizontalBarChart data={topExpenses} symbol={symbol} labelWidth={110} nameFontSize={11} />
        </BCCard>
      </div>
    </div>
  )
}
