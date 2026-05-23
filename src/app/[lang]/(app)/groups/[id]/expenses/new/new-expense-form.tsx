'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BCIcon, BCSectionLabel, BCNumPad, BCAmountDisplay, BCChip, BCTopBar, BC_CATEGORIES } from '@/components/bc-ui'
import { addExpense } from './actions'
import { currencySymbol, formatCurrency, suggestedAmounts } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { CategoryPicker } from '../_components/category-picker'
import { PaidByPicker } from '../_components/paid-by-picker'
import { SplitEditor, SplitMethod } from '../_components/split-editor'

type Member = { id: string; displayName: string; defaultShare: number }

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
  const tExpense = useTranslations('expense')
  const sym = currencySymbol(currency)
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState<'amount' | 'details'>('amount')

  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState<string | null>(members[0]?.id ?? null)
  const [category, setCategory] = useState('food')
  const [splitWith, setSplitWith] = useState<string[] | null>(null)
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [memberInputs, setMemberInputs] = useState<Record<string, string>>({})

  const onKey = (k: string) => {
    setAmountStr((s) => {
      if (k === 'del') return s.slice(0, -1)
      if (k === '.') return !s.includes('.') && s.length > 0 ? s + '.' : s
      if (s.includes('.') && s.split('.')[1].length >= 2) return s
      if (s === '0' && k !== '.') return k
      return s + k
    })
  }

  const amount = parseFloat(amountStr) || 0
  const selected = splitWith ?? members.map((m) => m.id)

  const toggleMember = (mid: string) => {
    const cur = splitWith ?? members.map((m) => m.id)
    const has = cur.includes(mid)
    const next = has ? cur.filter((x) => x !== mid) : [...cur, mid]
    setSplitWith(next.length ? next : cur)
  }

  const switchMethod = (m: SplitMethod) => {
    setSplitMethod(m)
    if (m === 'shares') {
      const inputs: Record<string, string> = {}
      for (const member of members) inputs[member.id] = String(member.defaultShare)
      setMemberInputs(inputs)
    } else if (m === 'percentage') {
      const pct = members.length > 0 ? (100 / members.length).toFixed(1) : '0'
      const inputs: Record<string, string> = {}
      for (const member of members) inputs[member.id] = pct
      setMemberInputs(inputs)
    } else if (m === 'amount') {
      const each = amount > 0 ? (amount / members.length).toFixed(2) : ''
      const inputs: Record<string, string> = {}
      for (const member of members) inputs[member.id] = each
      setMemberInputs(inputs)
    } else {
      setMemberInputs({})
    }
  }

  const totalShares = members.reduce((s, m) => s + (parseFloat(memberInputs[m.id] || '0') || 0), 0)
  const inputSum = splitMethod === 'amount' ? members.reduce((s, m) => s + (parseFloat(memberInputs[m.id] || '0') || 0), 0) : 0
  const pctSum = splitMethod === 'percentage' ? members.reduce((s, m) => s + (parseFloat(memberInputs[m.id] || '0') || 0), 0) : 0

  const canSave = (() => {
    if (!paidBy || !(amount > 0) || !expenseDate) return false
    if (splitMethod === 'equal') return selected.length > 0
    if (splitMethod === 'amount') return inputSum > 0 && Math.abs(inputSum - amount) < 0.015
    if (splitMethod === 'shares') return totalShares > 0
    if (splitMethod === 'percentage') return Math.abs(pctSum - 100) < 0.5
    return false
  })()

  async function handleSave() {
    if (pending || !paidBy || !canSave) return
    setPending(true)
    try {
      const perPerson = amount / Math.max(1, selected.length)
      const fd = new FormData()
      fd.set('description', description || t('untitled'))
      fd.set('amount', amount.toFixed(2))
      fd.set('paidBy', paidBy)
      fd.set('date', expenseDate)
      fd.set('category', category)

      if (splitMethod === 'equal') {
        for (const mid of selected) fd.set(`split_${mid}`, perPerson.toFixed(2))
        await addExpense(groupId, fd, 'amount')
      } else if (splitMethod === 'amount') {
        for (const m of members) {
          const val = parseFloat(memberInputs[m.id] || '0')
          if (val > 0) fd.set(`split_${m.id}`, val.toFixed(2))
        }
        await addExpense(groupId, fd, 'amount')
      } else if (splitMethod === 'shares') {
        for (const m of members) fd.set(`split_${m.id}`, memberInputs[m.id] || '0')
        await addExpense(groupId, fd, 'shares')
      } else {
        for (const m of members) fd.set(`split_${m.id}`, memberInputs[m.id] || '0')
        await addExpense(groupId, fd, 'percentage')
      }

      router.push(`/${locale}/groups/${groupId}`)
    } catch {
      setPending(false)
    }
  }

  if (step === 'amount') {
    return (
      <div className="bc-page">
        <BCTopBar
          title={t('title')}
          subtitle={groupName}
          left={
            <Link
              href={`/${locale}/groups/${groupId}`}
              className="bc-tap w-10 h-10 rounded-full flex items-center justify-center no-underline"
            >
              <BCIcon name="close" size={20} color="var(--bc-ink)" />
            </Link>
          }
        />

        <div className="px-5.5 pt-2">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('placeholder_what')}
            className="w-full border-0 outline-none bg-transparent font-sans font-medium text-[18px] text-(--bc-ink) tracking-[-0.01em] py-1.5 box-border"
          />
          <div className="h-px bg-(--bc-softhair) mt-0.5" />
        </div>

        <div className="flex gap-2 overflow-x-auto px-5.5 py-2 no-scrollbar">
          {Object.entries(BC_CATEGORIES).map(([key, { glyph }]) => {
            const label = tCat(key as Parameters<typeof tCat>[0])
            const active = category === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDescription(label)
                  setCategory(key)
                }}
                className={cn(
                  'bc-tap border-0 cursor-pointer shrink-0 py-1.5 px-3 rounded-full font-sans font-medium text-[13px] inline-flex items-center gap-1.5',
                  active ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
                )}
              >
                <span className="font-mono text-[11px]">{glyph}</span>
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 py-5">
          <BCSectionLabel>{t('amount')}</BCSectionLabel>
          <div className="mt-4">
            <BCAmountDisplay value={amountStr} currency={currency} size={88} />
          </div>
          <div className="flex gap-2 mt-6 flex-wrap justify-center">
            {suggestedAmounts(currency).map((n) => (
              <BCChip key={n} onClick={() => setAmountStr(String(n))}>
                {formatCurrency(n, currency)}
              </BCChip>
            ))}
          </div>
        </div>

        <BCNumPad onKey={onKey} />

        <div className="px-4.5 pb-4.5 pt-1">
          <button
            type="button"
            disabled={!(amount > 0)}
            onClick={() => setStep('details')}
            className={cn(
              'bc-tap border-0 py-3.75 px-5.5 rounded-full font-sans font-medium text-base w-full flex items-center justify-center gap-2.5',
              amount > 0 ? 'bg-(--bc-accent) text-white cursor-pointer' : 'bg-(--bc-chip) text-(--bc-muted) cursor-not-allowed opacity-50',
            )}
          >
            {t('continue')}
            <BCIcon name="arrowR" size={18} color={amount > 0 ? '#fff' : 'var(--bc-muted)'} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bc-page">
      <BCTopBar
        title={t('title')}
        subtitle={groupName}
        left={
          <button
            type="button"
            onClick={() => setStep('amount')}
            className="bc-tap w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center"
          >
            <BCIcon name="back" size={20} color="var(--bc-ink)" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3 px-1 py-1">
          <div className="min-w-0 flex-1">
            <div className="font-sans font-medium text-base text-(--bc-ink) tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">
              {description || t('untitled')}
            </div>
            <div className="font-mono text-[11px] text-(--bc-muted) mt-0.5 tracking-[0.04em]">
              {new Date(expenseDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="font-serif text-[36px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.015em]">
            {sym}
            {amount.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{tExpense('date')}</BCSectionLabel>
          </div>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full border border-(--bc-softhair) outline-none bg-(--bc-surface) rounded-[14px] px-3.5 py-3 font-sans font-medium text-[15px] text-(--bc-ink) box-border"
          />
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{t('paid_by')}</BCSectionLabel>
          </div>
          <PaidByPicker members={members} paidBy={paidBy} onChange={(id) => setPaidBy(id)} />
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{t('category')}</BCSectionLabel>
          </div>
          <CategoryPicker category={category} onChange={setCategory} />
        </div>

        <SplitEditor
          members={members}
          splitMethod={splitMethod}
          onSwitchMethod={switchMethod}
          selected={selected}
          onToggleMember={toggleMember}
          memberInputs={memberInputs}
          onChangeInput={(id, val) => setMemberInputs((prev) => ({ ...prev, [id]: val }))}
          editedAmount={amount}
          sym={sym}
        />
      </div>

      <div className="px-4 pb-4 pt-1">
        <button
          type="button"
          disabled={pending || !canSave}
          onClick={handleSave}
          className={cn(
            'bc-tap border-0 py-3.75 px-5.5 rounded-full cursor-pointer font-sans font-medium text-base w-full flex items-center justify-center gap-2.5 bg-(--bc-accent) text-white',
            (pending || !canSave) && 'opacity-40',
          )}
        >
          <BCIcon name="check" size={18} color="#fff" strokeWidth={2.2} />
          {pending ? '…' : t('save')}
        </button>
      </div>
    </div>
  )
}
