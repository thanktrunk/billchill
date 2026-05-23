'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BCIcon, BCCard, BCSectionLabel, BCAvatar, BCCategoryBadge, BCTopBar } from '@/components/bc-ui'
import { formatCurrency, currencySymbol } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { updateExpense, deleteExpense } from './actions'
import { CategoryPicker } from '../_components/category-picker'
import { PaidByPicker } from '../_components/paid-by-picker'
import { SplitEditor, SplitMethod } from '../_components/split-editor'

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
  const router = useRouter()
  const t = useTranslations('expense')
  const tAdd = useTranslations('add')
  const sym = currencySymbol(expense.currency)

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [pending, setPending] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [description, setDescription] = useState(expense.description)
  const [amountStr, setAmountStr] = useState(parseFloat(expense.amount).toFixed(2))
  const [editDate, setEditDate] = useState(expense.date)
  const [paidBy, setPaidBy] = useState(expense.paidBy)
  const [category, setCategory] = useState(expense.category ?? 'other')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('amount')
  const [memberInputs, setMemberInputs] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const s of splits) m[s.memberId] = parseFloat(s.shareAmount).toFixed(2)
    return m
  })
  const [splitWith, setSplitWith] = useState<string[]>(() => splits.filter((s) => parseFloat(s.shareAmount) > 0).map((s) => s.memberId))

  const amount = parseFloat(expense.amount)
  const editedAmount = parseFloat(amountStr) || 0
  const selected = splitWith.length > 0 ? splitWith : allMembers.map((m) => m.id)
  const perPerson = editedAmount / Math.max(1, selected.length)
  const inputSum = allMembers.reduce((s, m) => s + (parseFloat(memberInputs[m.id] || '0') || 0), 0)
  const totalShares = inputSum
  const pctSum = inputSum

  const canSave = (() => {
    if (!description.trim() || !paidBy || !editDate || editedAmount <= 0) return false
    if (splitMethod === 'equal') return selected.length > 0
    if (splitMethod === 'amount') return Math.abs(inputSum - editedAmount) < 0.015
    if (splitMethod === 'shares') return totalShares > 0
    if (splitMethod === 'percentage') return Math.abs(pctSum - 100) < 0.5
    return false
  })()

  function getMemberAmount(m: Member): number {
    if (splitMethod === 'shares') {
      const share = parseFloat(memberInputs[m.id] || '0') || 0
      return totalShares > 0 ? (editedAmount * share) / totalShares : 0
    }
    if (splitMethod === 'percentage') {
      const pct = parseFloat(memberInputs[m.id] || '0') || 0
      return (editedAmount * pct) / 100
    }
    return parseFloat(memberInputs[m.id] || '0') || 0
  }

  function switchMethod(m: SplitMethod) {
    setSplitMethod(m)
    if (m === 'equal') {
      setSplitWith(allMembers.map((x) => x.id))
    } else if (m === 'amount') {
      const each = editedAmount > 0 ? (editedAmount / allMembers.length).toFixed(2) : ''
      const inputs: Record<string, string> = {}
      for (const member of allMembers) inputs[member.id] = each
      setMemberInputs(inputs)
    } else if (m === 'shares') {
      const inputs: Record<string, string> = {}
      for (const member of allMembers) inputs[member.id] = String(member.defaultShare)
      setMemberInputs(inputs)
    } else {
      const pct = allMembers.length > 0 ? (100 / allMembers.length).toFixed(1) : '0'
      const inputs: Record<string, string> = {}
      for (const member of allMembers) inputs[member.id] = pct
      setMemberInputs(inputs)
    }
  }

  function toggleMember(mid: string) {
    const has = selected.includes(mid)
    const next = has ? selected.filter((x) => x !== mid) : [...selected, mid]
    setSplitWith(next.length ? next : selected)
    if (has && splitMethod !== 'equal') {
      setMemberInputs((prev) => ({ ...prev, [mid]: '0' }))
    }
  }

  async function handleSave() {
    if (pending || !canSave) return
    setPending(true)
    try {
      let splitData: { memberId: string; shareAmount: string }[]
      if (splitMethod === 'equal') {
        splitData = selected.map((mid) => ({ memberId: mid, shareAmount: perPerson.toFixed(2) }))
      } else if (splitMethod === 'amount') {
        splitData = allMembers
          .filter((m) => parseFloat(memberInputs[m.id] || '0') > 0)
          .map((m) => ({ memberId: m.id, shareAmount: parseFloat(memberInputs[m.id]).toFixed(2) }))
      } else {
        splitData = allMembers
          .filter((m) => getMemberAmount(m) > 0)
          .map((m) => ({ memberId: m.id, shareAmount: getMemberAmount(m).toFixed(2) }))
      }

      await updateExpense(lang, expense.id, {
        description,
        amount: editedAmount.toFixed(2),
        paidBy,
        date: editDate,
        category: category || null,
        splits: splitData,
      })
      setPending(false)
      setMode('view')
      router.refresh()
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
      <div className="bc-page">
        <BCTopBar
          title={t('title')}
          left={
            <Link
              href={`/${lang}/groups/${groupId}`}
              className="bc-tap w-10 h-10 rounded-full flex items-center justify-center no-underline"
            >
              <BCIcon name="back" size={20} color="var(--bc-ink)" />
            </Link>
          }
          right={
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="bc-tap border-0 bg-(--bc-chip) text-(--bc-ink) px-4 py-2 rounded-full cursor-pointer font-sans font-medium text-[13px]"
            >
              {t('edit')}
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4.5 pb-25">
          <BCCard>
            <div className="flex items-start gap-3.5">
              <BCCategoryBadge category={expense.category ?? 'other'} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-sans font-semibold text-[17px] text-(--bc-ink) tracking-[-0.005em]">{expense.description}</div>
                <div className="font-sans text-xs text-(--bc-muted) mt-0.75">
                  {expense.date} · {payer?.displayName ?? '?'}
                </div>
              </div>
              <div className="font-serif text-[36px] leading-none text-(--bc-ink) tabular-nums tracking-[-0.015em]">
                {formatCurrency(amount, expense.currency)}
              </div>
            </div>
          </BCCard>

          <div>
            <div className="px-1 pb-2">
              <BCSectionLabel>{t('split_breakdown')}</BCSectionLabel>
            </div>
            <BCCard padded={false}>
              {splits.map((s, i) => {
                const member = allMembers.find((m) => m.id === s.memberId)
                const share = parseFloat(s.shareAmount)
                return (
                  <div key={s.memberId} className={cn('flex items-center gap-3 px-3.5 py-2.5', i > 0 && 'border-t border-(--bc-softhair)')}>
                    <BCAvatar name={member?.displayName ?? '?'} seed={s.memberId} size={32} />
                    <div className="flex-1 font-sans font-medium text-[14.5px] text-(--bc-ink)">{member?.displayName ?? '?'}</div>
                    <div className="font-mono text-[13px] text-(--bc-ink) tabular-nums">{formatCurrency(share, expense.currency)}</div>
                  </div>
                )
              })}
            </BCCard>
          </div>
        </div>

        <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
          {confirmDelete ? (
            <>
              <div className="font-sans text-sm text-(--bc-muted) text-center py-1">{t('confirm_delete')}</div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="bc-tap flex-1 border border-(--bc-hair) bg-transparent text-(--bc-ink) py-3.5 rounded-full cursor-pointer font-sans font-medium text-[15px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className={cn(
                    'bc-tap flex-1 border-0 bg-[#E5572F] text-white py-3.5 rounded-full cursor-pointer font-sans font-medium text-[15px]',
                    pending && 'opacity-50',
                  )}
                >
                  {pending ? '…' : t('delete')}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="bc-tap border border-(--bc-softhair) bg-transparent text-(--bc-neg) py-3.5 rounded-full cursor-pointer font-sans font-medium text-[15px] w-full"
            >
              {t('delete')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bc-page">
      <BCTopBar
        title={t('edit')}
        left={
          <button
            type="button"
            onClick={() => setMode('view')}
            className="bc-tap w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center"
          >
            <BCIcon name="back" size={20} color="var(--bc-ink)" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3.5">
        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{tAdd('placeholder_what')}</BCSectionLabel>
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-(--bc-softhair) outline-none bg-(--bc-surface) rounded-[14px] px-3.5 py-3 font-sans font-medium text-[15px] text-(--bc-ink) box-border"
          />
        </div>

        <div className="flex gap-2.5">
          <div className="flex-1">
            <div className="px-1 pb-2">
              <BCSectionLabel>{tAdd('amount')}</BCSectionLabel>
            </div>
            <div className="flex items-center gap-1.5 border border-(--bc-softhair) rounded-[14px] px-3.5 py-3 bg-(--bc-surface)">
              <span className="font-mono text-sm text-(--bc-muted)">{sym}</span>
              <input
                type="number"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="flex-1 border-0 outline-none bg-transparent font-mono font-medium text-[15px] text-(--bc-ink) tabular-nums"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="px-1 pb-2">
              <BCSectionLabel>{t('date')}</BCSectionLabel>
            </div>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full border border-(--bc-softhair) outline-none bg-(--bc-surface) rounded-[14px] px-3.5 py-3 font-sans font-medium text-[15px] text-(--bc-ink) box-border"
            />
          </div>
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{tAdd('paid_by')}</BCSectionLabel>
          </div>
          <PaidByPicker members={allMembers} paidBy={paidBy} onChange={setPaidBy} />
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{tAdd('category')}</BCSectionLabel>
          </div>
          <CategoryPicker category={category} onChange={setCategory} />
        </div>

        <SplitEditor
          members={allMembers}
          splitMethod={splitMethod}
          onSwitchMethod={switchMethod}
          selected={selected}
          onToggleMember={toggleMember}
          memberInputs={memberInputs}
          onChangeInput={(id, val) => setMemberInputs((prev) => ({ ...prev, [id]: val }))}
          editedAmount={editedAmount}
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
