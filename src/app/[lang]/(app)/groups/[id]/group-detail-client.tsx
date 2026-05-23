'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BCIcon, BCCard, BCTabs } from '@/components/bc-ui'
import { currencySymbol } from '@/lib/currency'
import { ExpensesTab } from './_components/expenses-tab'
import { BalancesTab } from './_components/balances-tab'
import { MembersTab } from './_components/members-tab'
import { SettingsTab } from './_components/settings-tab'

type Member = { id: string; displayName: string; userId: string | null; avatarUrl?: string | null }
type AllMember = {
  id: string
  displayName: string
  userId: string | null
  defaultShare: number
  isActive: boolean
  avatarUrl?: string | null
}
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
type Balance = { memberId: string; displayName: string; balance: number }
type Debt = {
  from: { memberId: string; displayName: string }
  to: { memberId: string; displayName: string }
  amount: number
}

export function GroupDetailClient({
  group,
  members,
  allMembers,
  expenses,
  splits,
  settlements,
  balances,
  minimizedDebts,
  myMemberId,
  myBalance,
}: {
  group: { id: string; name: string; currency: string }
  members: Member[]
  allMembers: AllMember[]
  expenses: Expense[]
  splits: Split[]
  settlements: Settlement[]
  balances: Balance[]
  minimizedDebts: Debt[]
  myMemberId: string | null
  myBalance: number
}) {
  const locale = useLocale()
  const tGroup = useTranslations('group')

  const [tab, setTab] = useState<'expenses' | 'balances' | 'members' | 'settings'>('expenses')
  const sym = currencySymbol(group.currency)

  const isOwed = myBalance > 0.005
  const isOwing = myBalance < -0.005
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  return (
    <div className="bc-page">
      <div className="flex items-center justify-between px-4 pt-2 pb-1 min-h-13">
        <Link href={`/${locale}/groups`} className="bc-tap w-10 h-10 rounded-full flex items-center justify-center no-underline">
          <BCIcon name="back" size={20} color="var(--bc-ink)" />
        </Link>
        <div className="text-center flex-1">
          <div className="font-sans font-medium text-[15px] text-(--bc-ink) tracking-[-0.005em]">{group.name}</div>
          <div className="font-sans text-[11px] text-(--bc-muted) mt-0.5 tracking-[0.04em]">
            {tGroup(members.length === 1 ? 'members_count_one' : 'members_count_other', { 0: members.length })} · {group.currency}
          </div>
        </div>
        <div className="w-10" />
      </div>

      <div className="px-4 pt-1.5">
        <BCCard padded={false} className="px-4.5 py-4 bg-(--bc-ink) border-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-sans text-[11px] opacity-[0.55] uppercase tracking-[0.14em] text-(--bc-bg)">
                {isOwed ? tGroup('youre_owed') : isOwing ? tGroup('you_owe') : tGroup('all_settled')}
              </div>
              <div
                className="font-serif text-[44px] leading-[0.95] tracking-[-0.02em] mt-1.5"
                style={{ color: Math.abs(myBalance) < 0.005 ? 'var(--bc-bg)' : isOwed ? '#9CC8A8' : '#F2A788' }}
              >
                {sym}
                {Math.abs(myBalance).toFixed(2)}
              </div>
              <div className="font-sans text-[11px] opacity-[0.45] mt-2 tracking-[0.06em] text-(--bc-bg) uppercase">
                {tGroup('total_spent')} {sym}
                {totalSpent.toFixed(2)}
              </div>
            </div>
            <Link
              href={`/${locale}/groups/${group.id}/settle`}
              className="bc-tap bg-[rgba(245,241,234,0.12)] text-(--bc-bg) border-0 py-3 px-4.5 rounded-full cursor-pointer font-sans font-medium text-[13px] tracking-[-0.005em] inline-flex items-center gap-1.5 no-underline"
            >
              <BCIcon name="swap" size={14} color="var(--bc-bg)" strokeWidth={1.8} />
              {tGroup('settle_up')}
            </Link>
          </div>
        </BCCard>
      </div>

      <div className="pt-3.5 pb-2">
        <BCTabs
          active={tab}
          onChange={(k) => setTab(k as typeof tab)}
          tabs={[
            { k: 'expenses', label: tGroup('tab_expenses', { 0: expenses.length }) },
            { k: 'balances', label: tGroup('tab_balances') },
            { k: 'members', label: tGroup('tab_members') },
            { k: 'settings', label: tGroup('tab_settings') },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-40">
        {tab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            splits={splits}
            settlements={settlements}
            members={members}
            myMemberId={myMemberId}
            sym={sym}
            groupId={group.id}
          />
        )}
        {tab === 'balances' && (
          <BalancesTab
            members={members}
            balances={balances}
            minimizedDebts={minimizedDebts}
            myMemberId={myMemberId}
            sym={sym}
            groupId={group.id}
          />
        )}
        {tab === 'members' && <MembersTab groupId={group.id} allMembers={allMembers} />}
        {tab === 'settings' && <SettingsTab group={group} />}
      </div>

      {tab === 'expenses' && (
        <div className="fixed bottom-25 right-4.5 z-25">
          <Link
            href={`/${locale}/groups/${group.id}/expenses/new`}
            className="bc-tap bg-(--bc-accent) text-white border-0 cursor-pointer py-3.5 pr-5.5 pl-4.5 rounded-full inline-flex items-center gap-2 font-sans font-medium text-[15px] tracking-[-0.005em] shadow-[0_14px_30px_rgba(229,87,47,0.35),0_4px_10px_rgba(0,0,0,0.12)] no-underline"
          >
            <BCIcon name="plus" size={20} color="#fff" strokeWidth={2.2} />
            {tGroup('add_expense')}
          </Link>
        </div>
      )}
    </div>
  )
}
