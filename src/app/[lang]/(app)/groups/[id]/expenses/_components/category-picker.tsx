'use client'

import { useTranslations } from 'next-intl'
import { BC_CATEGORIES } from '@/components/bc-ui'
import { cn } from '@/lib/utils'

export function CategoryPicker({ category, onChange }: { category: string; onChange: (k: string) => void }) {
  const tCat = useTranslations('cat')
  return (
    <div className="flex gap-2 overflow-x-auto px-1 pb-1">
      {Object.entries(BC_CATEGORIES).map(([k, c]) => {
        const sel = category === k
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className="bc-tap border-0 cursor-pointer bg-transparent p-1 flex flex-col items-center gap-1.5 shrink-0"
          >
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center font-serif text-[22px] tracking-[-0.02em] transition-[background,color,box-shadow] duration-160"
              style={{
                background: sel ? c.tint : 'var(--bc-chip)',
                color: sel ? '#fff' : c.tint,
                boxShadow: sel ? `0 4px 12px ${c.tint}55` : 'none',
              }}
            >
              {c.glyph}
            </div>
            <div className={cn('font-sans text-[11px] whitespace-nowrap', sel ? 'text-(--bc-ink)' : 'text-(--bc-muted)')}>
              {tCat(k as Parameters<typeof tCat>[0])}
            </div>
          </button>
        )
      })}
    </div>
  )
}
