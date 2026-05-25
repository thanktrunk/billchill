'use client'

import { useTransition } from 'react'
import { BCIcon } from '@/components/bc-ui'
import { toggleGroupStarAction } from './actions'

export function StarButton({ groupId, lang, starred }: { groupId: string; lang: string; starred: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        startTransition(() => toggleGroupStarAction(groupId, lang))
      }}
      className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full transition-opacity ${isPending ? 'opacity-40' : 'opacity-100'}`}
      aria-label={starred ? 'Unstar group' : 'Star group'}
    >
      <BCIcon name={starred ? 'starFill' : 'star'} size={18} color={starred ? 'var(--bc-pos)' : 'var(--bc-muted)'} />
    </button>
  )
}
