'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BCCard, BCSectionLabel, BCAvatar, BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'

type Member = { id: string; displayName: string; userId: string | null; avatarUrl?: string | null }
type Balance = { memberId: string; displayName: string; balance: number }
type Debt = {
  from: { memberId: string; displayName: string }
  to: { memberId: string; displayName: string }
  amount: number
}

export function BalancesTab({
  members,
  balances,
  minimizedDebts,
  myMemberId,
  currency,
  groupId,
}: {
  members: Member[]
  balances: Balance[]
  minimizedDebts: Debt[]
  myMemberId: string | null
  currency: string
  groupId: string
}) {
  const locale = useLocale()
  const tGroup = useTranslations('group')
  const tCommon = useTranslations('common')

  return (
    <div className="flex flex-col gap-4.5">
      <div>
        <div className="px-1 pb-2">
          <BCSectionLabel>{tGroup('member_balances')}</BCSectionLabel>
        </div>
        <BCCard padded={false}>
          {members.map((m, i) => {
            const bal = balances.find((b) => b.memberId === m.id)?.balance ?? 0
            const isMe = m.id === myMemberId
            return (
              <div key={m.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-(--bc-softhair)')}>
                <BCAvatar name={m.displayName} seed={m.id} size={36} avatarUrl={m.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-medium text-[14.5px] text-(--bc-ink)">
                    {m.displayName}
                    {isMe && (
                      <span className="text-[10px] ml-2 px-1.75 py-0.5 rounded-full bg-(--bc-chip) text-(--bc-muted) tracking-[0.08em]">
                        {tGroup('you_label')}
                      </span>
                    )}
                  </div>
                  <div className="font-sans text-[11px] text-(--bc-muted) mt-0.5 tracking-[0.04em] uppercase">
                    {Math.abs(bal) < 0.005 ? tCommon('settled') : bal > 0 ? tGroup('is_owed') : tGroup('owes')}
                  </div>
                </div>
                <div
                  className={cn(
                    'font-serif text-[22px] leading-none tabular-nums tracking-[-0.01em]',
                    Math.abs(bal) < 0.005 ? 'text-(--bc-muted)' : bal > 0 ? 'text-(--bc-pos)' : 'text-(--bc-neg)',
                  )}
                >
                  {Math.abs(bal) < 0.005 ? '·' : bal > 0 ? formatCurrency(bal, currency) : `-${formatCurrency(Math.abs(bal), currency)}`}
                </div>
              </div>
            )
          })}
        </BCCard>
      </div>

      {minimizedDebts.length > 0 && (
        <div>
          <div className="px-1 pb-2 flex items-center justify-between">
            <BCSectionLabel>{tGroup('simplified_payments')}</BCSectionLabel>
            <div className="font-sans text-[11px] text-(--bc-muted) tracking-[0.04em]">
              {tGroup(minimizedDebts.length === 1 ? 'transfers_one' : 'transfers_other', { 0: minimizedDebts.length })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {minimizedDebts.map((debt, i) => {
              const involvesMe = debt.from.memberId === myMemberId || debt.to.memberId === myMemberId
              return (
                <Link
                  key={i}
                  href={`/${locale}/groups/${groupId}/settle?from=${debt.from.memberId}&to=${debt.to.memberId}`}
                  className="no-underline"
                >
                  <BCCard
                    padded={false}
                    className={cn(
                      'px-3.5 py-3',
                      involvesMe ? 'bg-(--bc-surface) border border-(--bc-softhair)' : 'bg-(--bc-chip) border-0',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <BCAvatar
                        name={debt.from.displayName}
                        seed={debt.from.memberId}
                        size={32}
                        avatarUrl={members.find((m) => m.id === debt.from.memberId)?.avatarUrl}
                      />
                      <BCIcon name="arrowR" size={16} color="var(--bc-muted)" strokeWidth={1.6} />
                      <BCAvatar
                        name={debt.to.displayName}
                        seed={debt.to.memberId}
                        size={32}
                        avatarUrl={members.find((m) => m.id === debt.to.memberId)?.avatarUrl}
                      />
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="font-sans font-medium text-sm text-(--bc-ink) tracking-[-0.005em]">
                          {tGroup('pays', { 0: debt.from.displayName, 1: debt.to.displayName })}
                        </div>
                      </div>
                      <div className="font-serif text-[22px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.01em]">
                        {formatCurrency(debt.amount, currency)}
                      </div>
                    </div>
                  </BCCard>
                </Link>
              )
            })}
          </div>
          <div className="mt-3">
            <Link
              href={`/${locale}/groups/${groupId}/settle`}
              className="bc-tap flex items-center justify-center gap-2.5 w-full py-3.75 px-5.5 rounded-full bg-(--bc-chip) text-(--bc-ink) font-sans font-medium text-base tracking-[-0.005em] no-underline"
            >
              <BCIcon name="swap" size={16} color="var(--bc-ink)" strokeWidth={1.8} />
              {tGroup('record_settlement')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
