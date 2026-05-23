'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts'
import { BCCard, BCSectionLabel, BC_CATEGORIES } from '@/components/bc-ui'
import { currencySymbol } from '@/lib/utils'

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
type Settlement = { id: string; fromMember: string; toMember: string; amount: string; settledAt: string }
type Balance = { memberId: string; displayName: string; balance: number }
type AllMember = { id: string; displayName: string; isActive: boolean }

function fmt(value: number | undefined, symbol: string) {
  if (value == null) return ''
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function BarAmountLabel(props: Record<string, unknown> & { symbol: string }) {
  const { x, y, width, height, value, symbol } = props
  const nx = Number(x),
    ny = Number(y),
    nw = Number(width),
    nh = Number(height),
    nv = Number(value)
  if (!isFinite(nx) || !isFinite(ny) || !isFinite(nw) || !isFinite(nh) || !isFinite(nv)) return null
  return (
    <text
      x={nx + nw + 6}
      y={ny + nh / 2}
      dominantBaseline="central"
      fontSize={11}
      fontFamily="var(--font-be-vietnam-pro)"
      fill="var(--bc-muted)"
    >
      {fmt(nv, symbol)}
    </text>
  )
}

function BarCountLabel(props: Record<string, unknown>) {
  const { x, y, width, height, value } = props
  const nx = Number(x),
    ny = Number(y),
    nw = Number(width),
    nh = Number(height),
    nv = Number(value)
  if (!isFinite(nx) || !isFinite(ny) || !isFinite(nw) || !isFinite(nh) || !isFinite(nv)) return null
  return (
    <text
      x={nx + nw + 6}
      y={ny + nh / 2}
      dominantBaseline="central"
      fontSize={11}
      fontFamily="var(--font-be-vietnam-pro)"
      fill="var(--bc-muted)"
    >
      {nv}
    </text>
  )
}

const TOOLTIP_STYLE = {
  background: 'var(--bc-surface)',
  border: '1px solid var(--bc-softhair)',
  borderRadius: 12,
  fontSize: 13,
  fontFamily: 'var(--font-be-vietnam-pro)',
}

const YAXIS_TICK = { fontSize: 12, fill: 'var(--bc-ink)', fontFamily: 'var(--font-be-vietnam-pro)' }

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
        .map((b) => ({ name: b.displayName, value: parseFloat(Math.abs(b.balance).toFixed(2)) }))
        .sort((a, b) => b.value - a.value),
    [balances],
  )

  const settlementProgress = useMemo(() => {
    const settled = settlements.reduce((s, t) => s + parseFloat(t.amount), 0)
    const outstanding = balances.reduce((s, b) => s + (b.balance > 0.005 ? b.balance : 0), 0)
    const total = settled + outstanding
    const pct = total > 0 ? Math.round((settled / total) * 100) : 0
    return { settled: parseFloat(settled.toFixed(2)), outstanding: parseFloat(outstanding.toFixed(2)), pct }
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
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {categoryData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [fmt(value as number | undefined, symbol), '']} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-sans text-[10px] text-(--bc-muted) uppercase tracking-[0.1em]">Total</span>
              <span className="font-serif text-[22px] leading-tight tracking-[-0.02em] text-(--bc-ink)">
                {fmt(
                  categoryData.reduce((s, e) => s + e.value, 0),
                  symbol,
                )}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 pb-1">
            {categoryData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                <span className="font-sans text-[12px] text-(--bc-muted) tracking-tight">{entry.name}</span>
                <span className="font-sans text-[12px] text-(--bc-ink) font-medium">{fmt(entry.value, symbol)}</span>
              </div>
            ))}
          </div>
        </BCCard>
      </div>

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_paid_by')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <ResponsiveContainer width="100%" height={Math.max(paidByData.length * 44, 80)}>
            <BarChart data={paidByData} layout="vertical" margin={{ left: 0, right: 72, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={YAXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [fmt(value as number | undefined, symbol), '']} contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                fill="var(--bc-accent)"
                radius={[0, 6, 6, 0]}
                barSize={22}
                label={(props) => <BarAmountLabel {...props} symbol={symbol} />}
              />
            </BarChart>
          </ResponsiveContainer>
        </BCCard>
      </div>

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_spent_by')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <ResponsiveContainer width="100%" height={Math.max(spentByData.length * 44, 80)}>
            <BarChart data={spentByData} layout="vertical" margin={{ left: 0, right: 72, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={YAXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [fmt(value as number | undefined, symbol), '']} contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="value"
                fill="var(--bc-pos)"
                radius={[0, 6, 6, 0]}
                barSize={22}
                label={(props) => <BarAmountLabel {...props} symbol={symbol} />}
              />
            </BarChart>
          </ResponsiveContainer>
        </BCCard>
      </div>

      {timeData.length > 1 && (
        <div className="flex flex-col gap-2">
          <BCSectionLabel>{tGroup('stats_over_time')}</BCSectionLabel>
          <BCCard padded={false} className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--bc-accent)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--bc-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--bc-softhair)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--bc-muted)', fontFamily: 'var(--font-be-vietnam-pro)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip formatter={(value) => [fmt(value as number | undefined, symbol), '']} contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--bc-accent)"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={{ r: 3, fill: 'var(--bc-accent)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </BCCard>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_top_expenses')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <ResponsiveContainer width="100%" height={Math.max(topExpenses.length * 44, 80)}>
            <BarChart data={topExpenses} layout="vertical" margin={{ left: 0, right: 72, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ ...YAXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [fmt(value as number | undefined, symbol), '']} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} label={(props) => <BarAmountLabel {...props} symbol={symbol} />}>
                {topExpenses.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BCCard>
      </div>

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_category_count')}</BCSectionLabel>
        <BCCard padded={false} className="p-4">
          <ResponsiveContainer width="100%" height={Math.max(categoryCountData.length * 44, 80)}>
            <BarChart data={categoryCountData} layout="vertical" margin={{ left: 0, right: 36, top: 4, bottom: 4 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={90} tick={YAXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${value}`, '']} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} label={(props) => <BarCountLabel {...props} />}>
                {categoryCountData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BCCard>
      </div>

      {topDebtorsData.length > 0 && (
        <div className="flex flex-col gap-2">
          <BCSectionLabel>{tGroup('stats_top_debtors')}</BCSectionLabel>
          <BCCard padded={false} className="p-4">
            <ResponsiveContainer width="100%" height={Math.max(topDebtorsData.length * 44, 80)}>
              <BarChart data={topDebtorsData} layout="vertical" margin={{ left: 0, right: 72, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={YAXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [fmt(value as number | undefined, symbol), '']} contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="value"
                  fill="var(--bc-neg)"
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  label={(props) => <BarAmountLabel {...props} symbol={symbol} />}
                />
              </BarChart>
            </ResponsiveContainer>
          </BCCard>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <BCSectionLabel>{tGroup('stats_settlement')}</BCSectionLabel>
        <BCCard padded={false} className="px-4 py-4">
          <div className="flex justify-between items-baseline mb-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.08em]">{tGroup('stats_settled')}</span>
              <span className="font-serif text-[20px] leading-tight tracking-[-0.02em] text-(--bc-pos)">
                {fmt(settlementProgress.settled, symbol)}
              </span>
            </div>
            <div className="font-serif text-[28px] tracking-[-0.02em] text-(--bc-muted)">{settlementProgress.pct}%</div>
            <div className="flex flex-col gap-0.5 items-end">
              <span className="font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.08em]">{tGroup('stats_outstanding')}</span>
              <span className="font-serif text-[20px] leading-tight tracking-[-0.02em] text-(--bc-neg)">
                {fmt(settlementProgress.outstanding, symbol)}
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
    </div>
  )
}
