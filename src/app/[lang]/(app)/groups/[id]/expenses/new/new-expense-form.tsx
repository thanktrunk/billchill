'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BCIcon, BCCard, BCSectionLabel, BCAvatar, BCNumPad, BCAmountDisplay, BCChip, BC_CATEGORIES, BCTopBar } from '@/components/bc-ui'
import { addExpense } from './actions'
import { currencySymbol } from '@/lib/utils'

type Member = { id: string; displayName: string }

export function NewExpenseForm({
  groupId,
  groupName,
  currency,
  members,
}: {
  groupId: string
  groupName: string
  currency: string
  members: Member[]
}) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('add')
  const tCat = useTranslations('cat')
  const sym = currencySymbol(currency)
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<'amount' | 'details'>('amount')

  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [paidBy, setPaidBy] = useState<string | null>(members[0]?.id ?? null)
  const [category, setCategory] = useState('food')
  const [splitWith, setSplitWith] = useState<string[] | null>(null)

  const onKey = (k: string) => {
    setAmountStr((s) => {
      if (k === 'del') return s.slice(0, -1)
      if (k === '.') {
        return !s.includes('.') && s.length > 0 ? s + '.' : s
      }
      if (s.includes('.') && s.split('.')[1].length >= 2) return s
      if (s === '0' && k !== '.') return k
      return s + k
    })
  }

  const amount = parseFloat(amountStr) || 0
  const selected = splitWith ?? members.map((m) => m.id)
  const perPerson = amount / Math.max(1, selected.length)

  const toggleMember = (mid: string) => {
    const cur = splitWith ?? members.map((m) => m.id)
    const has = cur.includes(mid)
    const next = has ? cur.filter((x) => x !== mid) : [...cur, mid]
    setSplitWith(next.length ? next : cur)
  }

  async function handleSave() {
    if (pending || !paidBy || !amount) return
    setPending(true)
    try {
      const fd = new FormData()
      fd.set('description', description || t('untitled'))
      fd.set('amount', amount.toFixed(2))
      fd.set('paidBy', paidBy)
      fd.set('date', new Date().toISOString().split('T')[0])
      fd.set('category', category)
      for (const mid of selected) {
        fd.set(`split_${mid}`, perPerson.toFixed(2))
      }
      await addExpense(groupId, fd, 'amount')
      router.push(`/${locale}/groups/${groupId}`)
    } catch {
      setPending(false)
    }
  }

  if (step === 'amount') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          background: 'var(--bc-bg)',
          color: 'var(--bc-ink)',
        }}
      >
        <BCTopBar
          title={t('title')}
          subtitle={groupName}
          left={
            <Link
              href={`/${locale}/groups/${groupId}`}
              className="bc-tap"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <BCIcon name="close" size={20} color="var(--bc-ink)" />
            </Link>
          }
        />

        <div style={{ padding: '8px 22px 0' }}>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('placeholder_what')}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
              fontWeight: 500,
              fontSize: 18,
              color: 'var(--bc-ink)',
              letterSpacing: '-0.01em',
              padding: '6px 0',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              height: 1,
              background: 'var(--bc-softhair)',
              marginTop: 2,
            }}
          />
        </div>

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
          <div style={{ marginTop: 16 }}>
            <BCAmountDisplay value={amountStr} currency={sym} size={88} />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 24,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <BCChip key={n} onClick={() => setAmountStr(String(n))}>
                {sym}
                {n}
              </BCChip>
            ))}
          </div>
        </div>

        <BCNumPad onKey={onKey} />

        <div style={{ padding: '4px 18px 18px' }}>
          <button
            type="button"
            disabled={!(amount > 0)}
            onClick={() => setStep('details')}
            className="bc-tap"
            style={{
              background: amount > 0 ? 'var(--bc-accent)' : 'var(--bc-chip)',
              color: amount > 0 ? '#fff' : 'var(--bc-muted)',
              border: 'none',
              padding: '15px 22px',
              borderRadius: 999,
              cursor: amount > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
              fontWeight: 500,
              fontSize: 16,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: amount > 0 ? 1 : 0.5,
            }}
          >
            {t('continue')}
            <BCIcon name="arrowR" size={18} color={amount > 0 ? '#fff' : 'var(--bc-muted)'} strokeWidth={2.2} />
          </button>
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
        color: 'var(--bc-ink)',
      }}
    >
      <BCTopBar
        title={t('title')}
        subtitle={groupName}
        left={
          <button
            type="button"
            onClick={() => setStep('amount')}
            className="bc-tap"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BCIcon name="back" size={20} color="var(--bc-ink)" />
          </button>
        }
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            padding: '4px 4px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                fontWeight: 500,
                fontSize: 16,
                color: 'var(--bc-ink)',
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {description || t('untitled')}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                color: 'var(--bc-muted)',
                marginTop: 2,
                letterSpacing: '0.04em',
              }}
            >
              {new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-newsreader), serif',
              fontSize: 36,
              lineHeight: 1,
              color: 'var(--bc-ink)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.015em',
            }}
          >
            {sym}
            {amount.toFixed(2)}
          </div>
        </div>

        <div>
          <div style={{ padding: '0 4px 8px' }}>
            <BCSectionLabel>{t('paid_by')}</BCSectionLabel>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 4px',
            }}
          >
            {members.map((m) => {
              const sel = m.id === paidBy
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidBy(m.id)}
                  className="bc-tap"
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    background: sel ? 'var(--bc-ink)' : 'var(--bc-chip)',
                    color: sel ? 'var(--bc-bg)' : 'var(--bc-ink)',
                    padding: '8px 14px 8px 8px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={24} />
                  {m.displayName}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ padding: '0 4px 8px' }}>
            <BCSectionLabel>{t('category')}</BCSectionLabel>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 4px 4px',
            }}
          >
            {Object.entries(BC_CATEGORIES).map(([k, c]) => {
              const sel = category === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCategory(k)}
                  className="bc-tap"
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: '4px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: sel ? c.tint : 'var(--bc-chip)',
                      color: sel ? '#fff' : c.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-newsreader), serif',
                      fontSize: 22,
                      letterSpacing: '-0.02em',
                      boxShadow: sel ? `0 4px 12px ${c.tint}55` : 'none',
                      transition: 'background 160ms, color 160ms, box-shadow 160ms',
                    }}
                  >
                    {c.glyph}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                      fontSize: 11,
                      color: sel ? 'var(--bc-ink)' : 'var(--bc-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tCat(k as Parameters<typeof tCat>[0])}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div
            style={{
              padding: '0 4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <BCSectionLabel>{t('split_with')}</BCSectionLabel>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                color: 'var(--bc-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {t('each', { 0: sym + perPerson.toFixed(2) })}
            </div>
          </div>
          <BCCard padded={false}>
            {members.map((m, i) => {
              const has = selected.includes(m.id)
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className="bc-tap"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--bc-softhair)',
                    cursor: 'pointer',
                  }}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={32} />
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                      fontWeight: 500,
                      fontSize: 14.5,
                      color: 'var(--bc-ink)',
                    }}
                  >
                    {m.displayName}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      fontSize: 12,
                      color: has ? 'var(--bc-ink)' : 'var(--bc-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {has ? `${sym}${perPerson.toFixed(2)}` : '—'}
                  </div>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: has ? 'var(--bc-accent)' : 'transparent',
                      border: has ? 'none' : '1.6px solid var(--bc-hair)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 160ms',
                    }}
                  >
                    {has && <BCIcon name="check" size={14} color="#fff" strokeWidth={2.4} />}
                  </div>
                </div>
              )
            })}
          </BCCard>
        </div>
      </div>

      <div style={{ padding: '4px 16px 16px' }}>
        <button
          type="button"
          disabled={pending || !paidBy || !selected.length || !(amount > 0)}
          onClick={handleSave}
          className="bc-tap"
          style={{
            background: 'var(--bc-accent)',
            color: '#fff',
            border: 'none',
            padding: '15px 22px',
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
            fontWeight: 500,
            fontSize: 16,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pending || !paidBy || !selected.length || !(amount > 0) ? 0.4 : 1,
          }}
        >
          <BCIcon name="check" size={18} color="#fff" strokeWidth={2.2} />
          {pending ? '…' : t('save')}
        </button>
      </div>
    </div>
  )
}
