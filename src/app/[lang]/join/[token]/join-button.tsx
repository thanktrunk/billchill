'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { joinGroupByToken } from './actions'

export function JoinButton({ lang, token }: { lang: string; token: string }) {
  const t = useTranslations('join')
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (joining) return
    setJoining(true)
    try {
      await joinGroupByToken(lang, token)
    } catch {
      setJoining(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={joining}
      className="bc-tap border-0 w-full py-3.75 px-5.5 rounded-full bg-(--bc-accent) text-white font-sans font-medium text-base cursor-pointer disabled:opacity-40"
    >
      {joining ? '…' : t('join_button')}
    </button>
  )
}
