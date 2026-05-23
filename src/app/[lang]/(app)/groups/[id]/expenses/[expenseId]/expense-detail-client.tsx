'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BCIcon, BCCard, BCSectionLabel, BCAvatar, BCCategoryBadge, BCTopBar, BC_CATEGORIES } from '@/components/bc-ui'
import { currencySymbol } from '@/lib/utils'
import { updateExpense, deleteExpense } from './actions'

type Member = { id: string; displayName: string; defaultShare: number }
type Split = { memberId: string; shareAmount: string }
type Expense = {
  id: string
  groupId: string
  description: string
  amount: string
  currency: string
  category: string | null
  date: string
  paidBy: string
  createdAt: string
}

export function ExpenseDetailClient({
  lang,
  groupId,
  expense,
  splits,
  allMembers,
}: {
  lang: string
  groupId: string
  expense: Expense
  splits: Split[]
  allMembers: Member[]
}) {
  const t = useTranslations('expense')
  const tCat = useTranslations('cat')
  const tAdd = useTranslations('add')
  const sym = currencySymbol(expense.currency)

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [description, setDescription] = useState(expense.description)
  const [paidBy, setPaidBy] = useState(expense.paidBy)
  const [category, setCategory] = useState(expense.category ?? 'other')
  const [splitInputs, setSplitInputs] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const s of splits) m[s.memberId] = parseFloat(s.shareAmount).toFixed(2)
    return m
  })

  const amount = parseFloat(expense.amount)
  const inputSum = Object.values(splitInputs).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const canSave = description.trim().length > 0 && paidBy && Math.abs(inputSum - amount) < 0.015

  async function handleSave() {
    if (pending || !canSave) return
    setPending(true)
    try {
      const splitData = Object.entries(splitInputs)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([memberId, shareAmount]) => ({ memberId, shareAmount: parseFloat(shareAmount).toFixed(2) }))

      await updateExpense(expense.id, {
        description,
        amount: expense.amount,
        paidBy,
        date: expense.date,
        category: category || null,
        splits: splitData,
      })
      setMode('view')
    } catch {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (pending) return
    setPending(true)
    try {
      await deleteExpense(lang, expense.id)
    } catch {
      setPending(false)
      setConfirmDelete(false)
    }
  }

  const payer = allMembers.find((m) => m.id === paidBy)

  if (mode === 'view') {
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
          left={
            <Link
              href={`/${lang}/groups/${groupId}`}
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
              <BCIcon name="back" size={20} color="var(--bc-ink)" />
            </Link>
          }
          right={
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="bc-tap"
              style={{
                border: 'none',
                background: 'var(--bc-chip)',
                color: 'var(--bc-ink)',
                padding: '8px 16px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              {t('edit')}
            </button>
          }
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <BCCard padded={false} style={{ padding: '18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <BCCategoryBadge category={expense.category ?? 'other'} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                    fontWeight: 600,
                    fontSize: 17,
                    color: 'var(--bc-ink)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {expense.description}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                    fontSize: 12,
                    color: 'var(--bc-muted)',
                    marginTop: 3,
                  }}
                >
                  {expense.date} · {payer?.displayName ?? '?'}
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
          </BCCard>

          <div>
            <div style={{ padding: '0 4px 8px' }}>
              <BCSectionLabel>{t('split_breakdown')}</BCSectionLabel>
            </div>
            <BCCard padded={false}>
              {splits.map((s, i) => {
                const member = allMembers.find((m) => m.id === s.memberId)
                const share = parseFloat(s.shareAmount)
                return (
                  <div
                    key={s.memberId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--bc-softhair)',
                    }}
                  >
                    <BCAvatar name={member?.displayName ?? '?'} seed={s.memberId} size={32} />
                    <div
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                        fontWeight: 500,
                        fontSize: 14.5,
                        color: 'var(--bc-ink)',
                      }}
                    >
                      {member?.displayName ?? '?'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        fontSize: 13,
                        color: 'var(--bc-ink)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {sym}
                      {share.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </BCCard>
          </div>
        </div>

        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {confirmDelete ? (
            <>
              <div
                style={{
                  fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                  fontSize: 14,
                  color: 'var(--bc-muted)',
                  textAlign: 'center',
                  padding: '4px 0',
                }}
              >
                {t('confirm_delete')}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="bc-tap"
                  style={{
                    flex: 1,
                    border: '1px solid var(--bc-hair)',
                    background: 'transparent',
                    color: 'var(--bc-ink)',
                    padding: '14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="bc-tap"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: '#E5572F',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                    fontWeight: 500,
                    fontSize: 15,
                    opacity: pending ? 0.5 : 1,
                  }}
                >
                  {pending ? '…' : t('delete')}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="bc-tap"
              style={{
                border: '1px solid var(--bc-softhair)',
                background: 'transparent',
                color: 'var(--bc-neg)',
                padding: '14px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                fontWeight: 500,
                fontSize: 15,
                width: '100%',
              }}
            >
              {t('delete')}
            </button>
          )}
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
        title={t('edit')}
        left={
          <button
            type="button"
            onClick={() => setMode('view')}
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ padding: '0 4px 8px' }}>
            <BCSectionLabel>{tAdd('placeholder_what')}</BCSectionLabel>
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid var(--bc-softhair)',
              outline: 'none',
              background: 'var(--bc-surface)',
              borderRadius: 14,
              padding: '12px 14px',
              fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
              fontWeight: 500,
              fontSize: 15,
              color: 'var(--bc-ink)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <div style={{ padding: '0 4px 8px' }}>
            <BCSectionLabel>{tAdd('paid_by')}</BCSectionLabel>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 4px' }}>
            {allMembers.map((m) => {
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
            <BCSectionLabel>{tAdd('category')}</BCSectionLabel>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 4px 4px' }}>
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
          <div style={{ padding: '0 4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <BCSectionLabel>{t('split_breakdown')}</BCSectionLabel>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                color: Math.abs(inputSum - amount) < 0.015 ? 'var(--bc-pos)' : 'var(--bc-neg)',
                letterSpacing: '0.04em',
              }}
            >
              {sym}
              {inputSum.toFixed(2)} / {sym}
              {amount.toFixed(2)}
            </div>
          </div>
          <BCCard padded={false}>
            {allMembers.map((m, i) => {
              const val = splitInputs[m.id] ?? ''
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--bc-softhair)',
                  }}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={32} />
                  <div
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-be-vietnam-pro), sans-serif',
                      fontWeight: 500,
                      fontSize: 14.5,
                      color: 'var(--bc-ink)',
                    }}
                  >
                    {m.displayName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12, color: 'var(--bc-muted)' }}>
                      {sym}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={val}
                      onChange={(e) => setSplitInputs((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: 72,
                        border: 'none',
                        outline: 'none',
                        background: 'var(--bc-chip)',
                        borderRadius: 8,
                        padding: '5px 8px',
                        fontFamily: 'var(--font-jetbrains-mono), monospace',
                        fontSize: 13,
                        color: 'var(--bc-ink)',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
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
          disabled={pending || !canSave}
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
            opacity: pending || !canSave ? 0.4 : 1,
          }}
        >
          <BCIcon name="check" size={18} color="#fff" strokeWidth={2.2} />
          {pending ? '…' : t('save')}
        </button>
      </div>
    </div>
  )
}
