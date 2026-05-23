import { notFound } from 'next/navigation'
import { db } from '@/db'
import { groups, groupMembers, expenses } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { requireUser } from '@/lib/auth'
import { hasLocale } from '@/lib/i18n'
import { BCIcon, BCCard, BCSectionLabel } from '@/components/bc-ui'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ProfileNameEditor } from './profile-name-editor'
import { cn } from '@/lib/utils'

function GroupGlyph({ name, size = 32 }: { name: string; size?: number }) {
  const ch = (name || '?').trim().charAt(0).toUpperCase()
  const colors = ['#E5572F', '#3F6E55', '#B7873A', '#7B5E8C', '#4A6B7C', '#A4452C', '#5B6E3F', '#8C5E3E']
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const bg = colors[Math.abs(hash) % colors.length]
  return (
    <div
      className="flex items-center justify-center font-serif shrink-0 text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: bg,
        fontSize: size * 0.55,
        letterSpacing: '-0.02em',
      }}
    >
      {ch}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <BCCard padded={false} className="p-3.5">
      <div className="font-sans text-[10px] text-(--bc-muted) tracking-[0.1em] uppercase">{label}</div>
      <div className="font-serif text-[30px] text-(--bc-ink) leading-[1.1] tracking-[-0.015em] mt-1.5 tabular-nums">{value}</div>
    </BCCard>
  )
}

export default async function ProfilePage({ params }: PageProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [user, t, tCommon] = await Promise.all([
    requireUser(),
    getTranslations({ locale: lang, namespace: 'profile' }),
    getTranslations({ locale: lang, namespace: 'common' }),
  ])

  const myMemberships = await db
    .select({ groupId: groupMembers.groupId, memberId: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id))

  const groupIds = myMemberships.map((m) => m.groupId)
  const memberIds = myMemberships.map((m) => m.memberId)

  const [allExpenses, allGroups] = await Promise.all([
    groupIds.length
      ? db.select({ amount: expenses.amount, paidBy: expenses.paidBy }).from(expenses).where(inArray(expenses.groupId, groupIds))
      : Promise.resolve([]),
    groupIds.length
      ? db
          .select({
            id: groups.id,
            name: groups.name,
            archivedAt: groups.archivedAt,
          })
          .from(groups)
          .where(inArray(groups.id, groupIds))
      : Promise.resolve([]),
  ])

  const activeGroups = allGroups.filter((g) => !g.archivedAt)
  const archivedGroups = allGroups.filter((g) => g.archivedAt)
  const totalLent = allExpenses.filter((e) => memberIds.includes(e.paidBy)).reduce((s, e) => s + parseFloat(e.amount), 0)

  const sym = '$'

  const prefRows = [
    {
      label: t('language'),
      value: lang === 'vi' ? 'Tiếng Việt' : 'English',
      href: lang === 'vi' ? '/en/profile' : '/vi/profile',
    },
    { label: t('default_currency'), value: 'USD' },
    { label: t('notifications'), value: t('all_on') },
    { label: t('appearance'), value: t('auto') },
    { label: t('connected_accounts'), value: '1' },
  ]

  return (
    <div className="bc-page">
      <div className="px-4 pt-2 pb-1 min-h-[52px] flex items-center justify-between">
        <div className="font-serif text-[28px] text-(--bc-ink) pl-1.5 tracking-[-0.015em]">{t('title')}</div>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-[160px] flex flex-col gap-4.5">
        <BCCard>
          <ProfileNameEditor
            displayName={user.displayName}
            userId={user.id}
            email={user.email}
            avatarUrl={user.avatarUrl}
            labels={{ edit: t('edit_name'), save: t('save_name'), cancel: t('cancel_name') }}
          />
        </BCCard>

        <div className="grid grid-cols-3 gap-2">
          <Stat label={t('stat_groups')} value={String(activeGroups.length)} />
          <Stat label={t('stat_expenses')} value={String(allExpenses.length)} />
          <Stat label={t('stat_total_lent')} value={`${sym}${totalLent.toFixed(0)}`} />
        </div>

        <div>
          <div className="px-1 pb-2">
            <BCSectionLabel>{t('preferences')}</BCSectionLabel>
          </div>
          <BCCard padded={false}>
            {prefRows.map((r, i) => {
              const inner = (
                <div
                  className={cn(
                    'flex items-center justify-between px-4.5 py-3.5',
                    i > 0 && 'border-t border-(--bc-softhair)',
                    r.href ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <div className="font-sans text-[15px] text-(--bc-ink)">{r.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-sans text-sm text-(--bc-muted)">{r.value}</div>
                    <BCIcon name="arrowR" size={14} color="var(--bc-muted)" strokeWidth={1.6} />
                  </div>
                </div>
              )
              return r.href ? (
                <Link key={r.label} href={r.href} className="no-underline">
                  {inner}
                </Link>
              ) : (
                <div key={r.label}>{inner}</div>
              )
            })}
          </BCCard>
        </div>

        {archivedGroups.length > 0 && (
          <div>
            <div className="px-1 pb-2">
              <BCSectionLabel>{t('archived_groups')}</BCSectionLabel>
            </div>
            <BCCard padded={false}>
              {archivedGroups.map((g, i) => (
                <div key={g.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-(--bc-softhair)')}>
                  <GroupGlyph name={g.name} size={32} />
                  <div className="flex-1 font-sans font-medium text-sm text-(--bc-ink)">{g.name}</div>
                  <div className="font-sans text-[11px] text-(--bc-muted) tracking-[0.06em] uppercase whitespace-nowrap">
                    {t('archived')}
                  </div>
                </div>
              ))}
            </BCCard>
          </div>
        )}

        <div className="text-center p-3 font-sans text-[11px] text-(--bc-muted) tracking-[0.1em] uppercase">{tCommon('app_footer')}</div>

        <a
          href={`/auth/logout?returnTo=${process.env.APP_BASE_URL ?? ''}/${lang}`}
          className="bc-tap bg-transparent text-(--bc-neg) border border-(--bc-softhair) py-3.5 px-5.5 rounded-full cursor-pointer font-sans font-medium text-[15px] tracking-[-0.005em] flex items-center justify-center gap-2 no-underline"
        >
          <BCIcon name="back" size={16} color="var(--bc-neg)" strokeWidth={1.8} />
          {t('logout')}
        </a>
      </div>
    </div>
  )
}
