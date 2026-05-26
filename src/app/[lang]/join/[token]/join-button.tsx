'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { BCAvatar } from '@/components/bc-ui'
import { joinGroupByToken } from './actions'

type GhostMember = { id: string; displayName: string }

const NEW_MEMBER_SENTINEL = '__new__'

export function JoinButton({ lang, token, ghostMembers }: { lang: string; token: string; ghostMembers: GhostMember[] }) {
  const t = useTranslations('join')
  const [joining, setJoining] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(ghostMembers.length ? null : NEW_MEMBER_SENTINEL)

  async function handleJoin() {
    if (joining || selectedId === null) return
    setJoining(true)
    try {
      const existingMemberId = selectedId === NEW_MEMBER_SENTINEL ? undefined : selectedId
      await joinGroupByToken(lang, token, existingMemberId)
    } catch {
      setJoining(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {ghostMembers.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-sans text-[13px] text-(--bc-muted) text-center">{t('claim_prompt')}</div>
          <div className="flex flex-col gap-1.5">
            {ghostMembers.map((m) => {
              const sel = selectedId === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(sel ? null : m.id)}
                  className={cn(
                    'bc-tap border-0 w-full py-2.5 px-4 rounded-2xl inline-flex items-center gap-2.5 font-sans font-medium text-[15px] cursor-pointer',
                    sel ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
                  )}
                >
                  <BCAvatar name={m.displayName} seed={m.id} size={28} />
                  {m.displayName}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setSelectedId(NEW_MEMBER_SENTINEL)}
              className={cn(
                'bc-tap border-0 w-full py-2.5 px-4 rounded-2xl font-sans font-medium text-[15px] cursor-pointer',
                selectedId === NEW_MEMBER_SENTINEL ? 'bg-(--bc-ink) text-(--bc-bg)' : 'bg-(--bc-chip) text-(--bc-ink)',
              )}
            >
              {t('claim_new')}
            </button>
          </div>
        </div>
      )}

      {selectedId !== null && (
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="bc-tap border-0 w-full py-3.75 px-5.5 rounded-full bg-(--bc-accent) text-white font-sans font-medium text-base cursor-pointer disabled:opacity-40"
        >
          {joining ? '…' : t('join_button')}
        </button>
      )}
    </div>
  )
}
