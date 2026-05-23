'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BCIcon } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'

export function BottomNav() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')

  const tabs = [
    { k: 'home', href: `/${locale}/groups`, label: t('groups'), icon: 'home' },
    {
      k: 'activity',
      href: `/${locale}/notifications`,
      label: t('notifications'),
      icon: 'activity',
    },
    {
      k: 'profile',
      href: `/${locale}/profile`,
      label: t('profile'),
      icon: 'user',
    },
  ]

  function isActive(href: string) {
    return pathname === href || (href !== `/${locale}` && pathname.startsWith(href))
  }

  return (
    <nav className="fixed left-0 right-0 bc-nav-bottom flex justify-center pointer-events-none z-20">
      <div className="inline-flex items-center gap-1 p-1.5 bg-(--bc-ink) text-(--bc-bg) rounded-full pointer-events-auto shadow-[0_14px_30px_rgba(0,0,0,0.18),0_4px_10px_rgba(0,0,0,0.08)]">
        {tabs.map((t) => {
          const sel = isActive(t.href)
          return (
            <Link
              key={t.k}
              href={t.href}
              className={cn(
                'bc-tap cursor-pointer rounded-full font-sans text-[13px] font-medium tracking-[-0.005em] inline-flex items-center gap-2 transition-[background,padding,color] duration-200 whitespace-nowrap no-underline',
                sel ? 'bg-(--bc-bg) text-(--bc-ink) px-4.5 py-2.5' : 'bg-transparent text-[rgba(245,241,234,0.8)] px-3.5 py-2.5',
              )}
            >
              <BCIcon name={t.icon} size={18} color={sel ? 'var(--bc-ink)' : 'rgba(245,241,234,0.8)'} strokeWidth={1.7} />
              {sel && <span>{t.label}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
