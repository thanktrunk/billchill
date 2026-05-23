'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { BCNumPad, BCAmountDisplay, BCButton, BCTopBar, BCIcon, BCCard, BCSectionLabel, BCAvatar } from '@/components/bc-ui'
import { recordSettlement } from './actions'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

type Member = { id: string; displayName: string }
type Debt = { from: string; to: string; amount: number }

function MemberRow({
  label,
  selectedId,
  onChange,
  members,
}: {
  label: string
  selectedId: string
  onChange: (id: string) => void
  members: Member[]
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-9 font-sans text-[11px] text-(--bc-muted) uppercase tracking-[0.12em] shrink-0">{label}</div>
      <div className="flex-1 flex gap-2 overflow-x-auto">
        {[...members]
          .sort((a, b) => (b.id === selectedId ? 1 : 0) - (a.id === selectedId ? 1 : 0))
          .map((m) => {
            const sel = m.id === selectedId
            return (
              <button
                key={m.id}
                onClick={() => onChange(m.id)}
                className={cn(
                  'bc-tap border-0 cursor-pointer shrink-0 py-1.5 pr-3 pl-1.5 rounded-full inline-flex items-center gap-1.5 font-sans font-medium text-[13px]',
                  sel ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
                )}
              >
                <BCAvatar name={m.displayName} seed={m.id} size={22} />
                {m.displayName}
              </button>
            )
          })}
      </div>
    </div>
  )
}

export function SettleForm({
  groupId,
  currency,
  members,
  suggestedDebt,
}: {
  groupId: string
  currency: string
  members: Member[]
  suggestedDebt: Debt | null
}) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('settle')

  const [fromId, setFromId] = useState(suggestedDebt?.from ?? members[0]?.id ?? '')
  const [toId, setToId] = useState(suggestedDebt?.to ?? members[1]?.id ?? '')
  const [amountStr, setAmountStr] = useState(suggestedDebt ? suggestedDebt.amount.toFixed(2) : '')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amount = parseFloat(amountStr) || 0

  function handleNumPad(key: string) {
    setAmountStr((s) => {
      if (key === 'del') return s.slice(0, -1)
      if (key === '.') return !s.includes('.') && s.length > 0 ? s + '.' : s
      if (s.includes('.') && s.split('.')[1].length >= 2) return s
      if (s === '0' && key !== '.') return key
      return s + key
    })
  }

  function swap() {
    setFromId(toId)
    setToId(fromId)
  }

  async function handleRecord() {
    if (amount <= 0 || !fromId || !toId || fromId === toId) return
    setLoading(true)
    setError('')
    try {
      await recordSettlement(groupId, fromId, toId, amount)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 bg-(--bc-bg)">
        <div className="w-20 h-20 rounded-full bg-(--bc-pos) text-white flex items-center justify-center shadow-[0_14px_30px_rgba(63,110,85,0.35)]">
          <BCIcon name="check" size={36} color="#fff" strokeWidth={2.4} />
        </div>
        <div className="mt-7 font-serif text-[40px] text-(--bc-ink) tracking-[-0.02em] text-center leading-[1.05]">{t('done_title')}</div>
        <div className="mt-2.5 font-sans text-[15px] text-(--bc-muted) text-center">{t('done_subtitle')}</div>
        <div className="mt-10 w-full">
          <BCButton variant="primary" full onClick={() => router.push(`/${locale}/groups/${groupId}`)}>
            {t('back_to_group')}
          </BCButton>
        </div>
      </div>
    )
  }

  return (
    <div className="bc-page">
      <BCTopBar
        title={t('title')}
        left={
          <button
            onClick={() => router.back()}
            className="bc-tap bg-transparent border-0 cursor-pointer p-2 flex items-center justify-center"
          >
            <BCIcon name="close" size={20} color="var(--bc-ink)" />
          </button>
        }
      />

      <div className="px-4 pt-3">
        <BCCard padded={false} className="px-4 py-1">
          <MemberRow label={t('from')} selectedId={fromId} onChange={setFromId} members={members} />
          <div className="flex justify-center py-0.5">
            <button
              onClick={swap}
              className="bc-tap border-0 bg-(--bc-chip) text-(--bc-ink) cursor-pointer w-8 h-8 rounded-full flex items-center justify-center"
            >
              <BCIcon name="swap" size={14} color="var(--bc-ink)" strokeWidth={1.8} />
            </button>
          </div>
          <MemberRow label={t('to')} selectedId={toId} onChange={setToId} members={members} />
        </BCCard>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-5">
        <BCSectionLabel>{t('amount')}</BCSectionLabel>
        <div className="mt-3.5">
          <BCAmountDisplay value={amountStr} currency={currency} size={72} />
        </div>
        {suggestedDebt && (
          <div className="mt-4">
            <button
              onClick={() => setAmountStr(suggestedDebt.amount.toFixed(2))}
              className="bc-tap bg-(--bc-chip) border-0 rounded-full px-3.5 py-2 font-sans text-[13px] text-(--bc-ink) cursor-pointer font-medium tracking-[-0.005em]"
            >
              {t('suggested', { 0: formatCurrency(suggestedDebt.amount, currency) })}
            </button>
          </div>
        )}
      </div>

      <BCNumPad onKey={handleNumPad} />

      {error && (
        <div className="mx-5 px-3.5 py-2.5 bg-[rgba(229,87,47,0.1)] rounded-[12px] font-sans text-[13px] text-(--bc-accent)">{error}</div>
      )}

      <div className="px-4 pb-4 pt-1">
        <BCButton
          variant={amount > 0 && fromId !== toId ? 'accent' : 'ghost'}
          full
          onClick={handleRecord}
          disabled={loading || amount <= 0 || fromId === toId}
          icon={<BCIcon name="check" size={18} color="#fff" strokeWidth={2.2} />}
        >
          {loading ? '…' : t('record')}
        </BCButton>
      </div>
    </div>
  )
}
