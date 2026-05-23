'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { BCNumPad, BCAmountDisplay, BCButton, BCTopBar, BCIcon, BCCard, BCSectionLabel, BCAvatar } from '@/components/bc-ui'
import { recordSettlement } from './actions'
import { currencySymbol } from '@/lib/utils'

type Member = { id: string; displayName: string }
type Debt = { from: string; to: string; amount: number }

function fmt(amount: number, sym: string) {
  return sym + amount.toFixed(2)
}

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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
      }}
    >
      <div
        style={{
          width: 36,
          fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
          fontSize: 11,
          color: 'var(--bc-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto' }}>
        {members.map((m) => {
          const sel = m.id === selectedId
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className="bc-tap"
              style={{
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                background: sel ? 'var(--bc-ink)' : 'var(--bc-chip)',
                color: sel ? 'var(--bc-bg)' : 'var(--bc-ink)',
                padding: '6px 12px 6px 6px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                fontWeight: 500,
                fontSize: 13,
              }}
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

  const sym = currencySymbol(currency)

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          gap: 0,
          padding: '0 24px',
          background: 'var(--bc-bg)',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: 'var(--bc-pos)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 14px 30px rgba(63,110,85,0.35)',
          }}
        >
          <BCIcon name="check" size={36} color="#fff" strokeWidth={2.4} />
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: 'var(--font-newsreader), serif',
            fontSize: 40,
            color: 'var(--bc-ink)',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          {t('done_title')}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
            fontSize: 15,
            color: 'var(--bc-muted)',
            textAlign: 'center',
          }}
        >
          {t('done_subtitle')}
        </div>
        <div style={{ marginTop: 40, width: '100%' }}>
          <BCButton variant="primary" full onClick={() => router.push(`/${locale}/groups/${groupId}`)}>
            {t('back_to_group')}
          </BCButton>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--bc-bg)',
      }}
    >
      <BCTopBar
        title={t('title')}
        left={
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BCIcon name="close" size={20} color="var(--bc-ink)" />
          </button>
        }
      />

      {/* From / Swap / To */}
      <div style={{ padding: '12px 16px 0' }}>
        <BCCard padded={false} style={{ padding: '4px 16px' }}>
          <MemberRow label={t('from')} selectedId={fromId} onChange={setFromId} members={members} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2px 0',
            }}
          >
            <button
              onClick={swap}
              className="bc-tap"
              style={{
                border: 'none',
                background: 'var(--bc-chip)',
                color: 'var(--bc-ink)',
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BCIcon name="swap" size={14} color="var(--bc-ink)" strokeWidth={1.8} />
            </button>
          </div>
          <MemberRow label={t('to')} selectedId={toId} onChange={setToId} members={members} />
        </BCCard>
      </div>

      {/* Amount */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px 24px',
        }}
      >
        <BCSectionLabel>{t('amount')}</BCSectionLabel>
        <div style={{ marginTop: 14 }}>
          <BCAmountDisplay value={amountStr} currency={sym} size={72} />
        </div>
        {suggestedDebt && (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setAmountStr(suggestedDebt.amount.toFixed(2))}
              className="bc-tap"
              style={{
                background: 'var(--bc-chip)',
                border: 'none',
                borderRadius: 999,
                padding: '8px 14px',
                fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                fontSize: 13,
                color: 'var(--bc-ink)',
                cursor: 'pointer',
                fontWeight: 500,
                letterSpacing: '-0.005em',
              }}
            >
              {t('suggested', { 0: fmt(suggestedDebt.amount, sym) })}
            </button>
          </div>
        )}
      </div>

      {/* Numpad */}
      <BCNumPad onKey={handleNumPad} />

      {error && (
        <div
          style={{
            margin: '0 20px',
            padding: '10px 14px',
            background: 'rgba(229,87,47,0.1)',
            borderRadius: 12,
            fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
            fontSize: 13,
            color: 'var(--bc-accent)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ padding: '4px 16px 16px' }}>
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
