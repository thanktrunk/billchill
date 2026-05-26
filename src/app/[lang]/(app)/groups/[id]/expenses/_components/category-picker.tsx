'use client'

import { useTranslations } from 'next-intl'
import { BC_CATEGORIES } from '@/components/bc-ui'
import { cn } from '@/lib/utils'

export function CategoryPicker({ category, onChange }: { category: string; onChange: (k: string) => void }) {
  const tCat = useTranslations('cat')
  return (
    <div className="flex flex-wrap gap-2 px-1 pb-1">
      {Object.entries(BC_CATEGORIES).map(([k, c]) => {
        const sel = category === k
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={cn(
              'bc-tap border-0 cursor-pointer py-1.5 px-3 rounded-full font-sans font-medium text-[13px] inline-flex items-center gap-1.5',
              sel ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
            )}
          >
            <span className="font-mono text-[11px]">{c.glyph}</span>
            {tCat(k as Parameters<typeof tCat>[0])}
          </button>
        )
      })}
    </div>
  )
}
