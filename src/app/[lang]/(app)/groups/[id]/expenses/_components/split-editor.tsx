'use client'

import { useTranslations } from 'next-intl'
import { BCCard, BCSectionLabel, BCAvatar, BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { currencySymbol, formatCurrency } from '@/lib/currency'

type Member = { id: string; displayName: string; defaultShare: number }
export type SplitMethod = 'equal' | 'amount' | 'shares' | 'percentage'

export function SplitEditor({
  members,
  splitMethod,
  onSwitchMethod,
  selected,
  onToggleMember,
  memberInputs,
  onChangeInput,
  editedAmount,
  currency,
}: {
  members: Member[]
  splitMethod: SplitMethod
  onSwitchMethod: (m: SplitMethod) => void
  selected: string[]
  onToggleMember: (id: string) => void
  memberInputs: Record<string, string>
  onChangeInput: (id: string, val: string) => void
  editedAmount: number
  currency: string
}) {
  const tAdd = useTranslations('add')

  const perPerson = editedAmount / Math.max(1, selected.length)
  const sumOfInputs = members.reduce((s, m) => s + (parseFloat(memberInputs[m.id] || '0') || 0), 0)

  function getMemberAmount(m: Member): number {
    if (splitMethod === 'shares') {
      const share = parseFloat(memberInputs[m.id] || '0') || 0
      return sumOfInputs > 0 ? (editedAmount * share) / sumOfInputs : 0
    }
    if (splitMethod === 'percentage') {
      const pct = parseFloat(memberInputs[m.id] || '0') || 0
      return (editedAmount * pct) / 100
    }
    return parseFloat(memberInputs[m.id] || '0') || 0
  }

  const summaryColor =
    splitMethod === 'amount'
      ? Math.abs(sumOfInputs - editedAmount) < 0.015
        ? 'text-(--bc-pos)'
        : 'text-(--bc-neg)'
      : splitMethod === 'percentage'
        ? Math.abs(sumOfInputs - 100) < 0.5
          ? 'text-(--bc-pos)'
          : 'text-(--bc-neg)'
        : 'text-(--bc-muted)'

  return (
    <div>
      <div className="px-1 pb-2 flex items-center justify-between">
        <BCSectionLabel>{tAdd('split_with')}</BCSectionLabel>
        <div className="flex gap-1.5">
          {(['equal', 'amount', 'shares', 'percentage'] as SplitMethod[]).map((m) => {
            const label =
              m === 'equal'
                ? tAdd('method_equal')
                : m === 'amount'
                  ? tAdd('method_amount')
                  : m === 'shares'
                    ? tAdd('method_shares')
                    : tAdd('method_pct')
            const sel = splitMethod === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSwitchMethod(m)}
                className={cn(
                  'bc-tap border-0 cursor-pointer py-1 px-2.5 rounded-full font-sans font-medium text-[11px] tracking-[-0.005em]',
                  sel ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-muted)',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {splitMethod === 'equal' ? (
        <BCCard padded={false}>
          {members.map((m, i) => {
            const has = selected.includes(m.id)
            return (
              <div
                key={m.id}
                onClick={() => onToggleMember(m.id)}
                className={cn('bc-tap flex items-center gap-3 px-3.5 py-2.5 cursor-pointer', i > 0 && 'border-t border-(--bc-softhair)')}
              >
                <BCAvatar name={m.displayName} seed={m.id} size={32} />
                <div className="flex-1 font-sans font-medium text-[14.5px] text-(--bc-ink)">{m.displayName}</div>
                <div className={cn('font-mono text-xs tabular-nums', has ? 'text-(--bc-ink)' : 'text-(--bc-muted)')}>
                  {has ? formatCurrency(perPerson, currency) : '—'}
                </div>
                <div
                  className={cn(
                    'w-6 h-6 rounded-[6px] flex items-center justify-center transition-[background] duration-160',
                    has ? 'bg-(--bc-accent) border-0' : 'bg-transparent border-[1.6px] border-(--bc-hair)',
                  )}
                >
                  {has && <BCIcon name="check" size={14} color="#fff" strokeWidth={2.4} />}
                </div>
              </div>
            )
          })}
        </BCCard>
      ) : (
        <>
          <BCCard padded={false}>
            {members.map((m, i) => {
              const has = selected.includes(m.id)
              const inputVal = memberInputs[m.id] ?? ''
              const computedAmt = getMemberAmount(m)
              return (
                <div
                  key={m.id}
                  onClick={() => onToggleMember(m.id)}
                  className={cn(
                    'bc-tap flex items-center gap-3 px-3.5 py-2.5 cursor-pointer',
                    i > 0 && 'border-t border-(--bc-softhair)',
                    !has && 'opacity-40',
                  )}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={32} />
                  <div className="flex-1 font-sans font-medium text-[14.5px] text-(--bc-ink)">{m.displayName}</div>
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                    {splitMethod !== 'amount' && has && (
                      <div className="font-mono text-[11px] text-(--bc-muted) tabular-nums">{formatCurrency(computedAmt, currency)}</div>
                    )}
                    <div className="flex items-center gap-0.5">
                      {splitMethod === 'percentage' && <span className="font-mono text-xs text-(--bc-muted)">%</span>}
                      {splitMethod === 'amount' && <span className="font-mono text-xs text-(--bc-muted)">{currencySymbol(currency)}</span>}
                      <input
                        type="number"
                        inputMode="decimal"
                        value={inputVal}
                        disabled={!has}
                        onChange={(e) => onChangeInput(m.id, e.target.value)}
                        placeholder="0"
                        className={cn(
                          'w-24 border-0 outline-none rounded-lg px-2 py-1.5 font-mono text-[13px] text-(--bc-ink) text-right tabular-nums',
                          has ? 'bg-(--bc-chip)' : 'bg-transparent',
                        )}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-[6px] flex items-center justify-center transition-[background] duration-160 shrink-0',
                      has ? 'bg-(--bc-accent) border-0' : 'bg-transparent border-[1.6px] border-(--bc-hair)',
                    )}
                  >
                    {has && <BCIcon name="check" size={14} color="#fff" strokeWidth={2.4} />}
                  </div>
                </div>
              )
            })}
          </BCCard>
          <div className={cn('pt-1.5 px-1 font-mono text-[11px] tracking-[0.04em] text-right', summaryColor)}>
            {splitMethod === 'amount' && tAdd('amount_remaining', { 0: formatCurrency(Math.abs(editedAmount - sumOfInputs), currency) })}
            {splitMethod === 'percentage' && tAdd('pct_total', { 0: sumOfInputs.toFixed(1) })}
            {splitMethod === 'shares' && `${sumOfInputs} shares`}
          </div>
        </>
      )}
    </div>
  )
}
