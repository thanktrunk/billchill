import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth'
import { getJoinPageData } from '@/db/queries/groups'
import { findGroupMemberByUser } from '@/db/mutations/group-members'
import { BCGroupGlyph } from '@/components/bc-ui'
import { JoinButton } from './join-button'

export default async function JoinPage({ params }: PageProps) {
  const { lang, token } = await params
  if (!hasLocale(lang)) notFound()

  const t = await getTranslations({ locale: lang, namespace: 'join' })

  const data = await getJoinPageData(token)
  if (!data) notFound()

  const { group, memberCount, ghostMembers } = data

  const user = await getCurrentUser()

  const alreadyMember = user ? !!(await findGroupMemberByUser(group.id, user.id)) : false

  const loginUrl = `/auth/login?returnTo=/${lang}/join/${token}`

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-(--bc-bg)">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <BCGroupGlyph name={group.name} size={72} imageUrl={group.imageUrl} />

        <div className="text-center">
          <div className="font-sans font-semibold text-xl text-(--bc-ink) tracking-tight">{group.name}</div>
          <div className="font-sans text-[13px] text-(--bc-muted) mt-1">
            {memberCount === 1 ? t('join_member_count_one', { 0: memberCount }) : t('join_member_count_other', { 0: memberCount })}
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          {!user && (
            <Link
              href={loginUrl}
              className="bc-tap border-0 w-full py-3.75 px-5.5 rounded-full bg-(--bc-accent) text-white font-sans font-medium text-base text-center no-underline"
            >
              {t('sign_in_to_join')}
            </Link>
          )}

          {user && alreadyMember && (
            <>
              <div className="font-sans text-sm text-(--bc-muted) text-center">{t('already_member')}</div>
              <Link
                href={`/${lang}/groups/${group.id}`}
                className="bc-tap border-0 w-full py-3.75 px-5.5 rounded-full bg-(--bc-chip) text-(--bc-ink) font-sans font-medium text-base text-center no-underline"
              >
                {t('go_to_group')}
              </Link>
            </>
          )}

          {user && !alreadyMember && <JoinButton lang={lang} token={token} ghostMembers={ghostMembers} />}
        </div>

        <div className="font-serif italic text-[13px] text-(--bc-muted)">{t('subtitle')}</div>
      </div>
    </div>
  )
}
