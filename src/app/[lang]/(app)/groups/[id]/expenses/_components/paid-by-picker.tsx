'use client'

import { BCAvatar } from '@/components/bc-ui'
import { cn } from '@/lib/utils'

type Member = { id: string; displayName: string }

export function PaidByPicker({ members, paidBy, onChange }: { members: Member[]; paidBy: string | null; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-1">
      {members.map((m) => {
        const sel = m.id === paidBy
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={cn(
              'bc-tap border-0 cursor-pointer shrink-0 py-2 pr-3.5 pl-2 rounded-full inline-flex items-center gap-2 font-sans font-medium text-[13px]',
              sel ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
            )}
          >
            <BCAvatar name={m.displayName} seed={m.id} size={24} />
            {m.displayName}
          </button>
        )
      })}
    </div>
  )
}
