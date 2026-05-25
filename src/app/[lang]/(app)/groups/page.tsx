import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { hasLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { AppCalculations } from '@/lib/app-calculations'
import { BCIcon, BCGroupGlyph, BCAvatarStack, BCCard, BCSectionLabel } from '@/components/bc-ui'
import { cn } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'
import { formatCurrency } from '@/lib/currency'
import { getGroupListDataForUser } from '@/db/queries/groups'
import { StarButton } from './star-button'

export default async function GroupsPage({ params }: PageProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [user, tCommon, tHome] = await Promise.all([
    requireUser(),
    getTranslations({ locale: lang, namespace: 'common' }),
    getTranslations({ locale: lang, namespace: 'home' }),
  ])

  const { myMemberships, allGroups, allMembers, allExpenses, allSettlements, allSplits } = await getGroupListDataForUser(user.id)

  const membershipMap = new Map(myMemberships.map((m) => [m.groupId, { myMemberId: m.myMemberId, starredAt: m.starredAt }]))

  let groupRows: GroupRow[] = []

  if (myMemberships.length > 0) {
    groupRows = allGroups
      .filter((g) => !g.archivedAt)
      .map((g) => {
        const membership = membershipMap.get(g.id)
        const members = allMembers.filter((m) => m.groupId === g.id)
        const gExpenses = allExpenses.filter((e) => e.groupId === g.id)
        const gSettlements = allSettlements.filter((s) => s.groupId === g.id)

        const myMemberId = membership?.myMemberId
        const balances = AppCalculations.calculateGroupBalances(
          members.map((m) => ({ id: m.id, displayName: m.displayName })),
          gExpenses.map((e) => ({ id: e.id, paidBy: e.paidBy })),
          allSplits,
          gSettlements.map((s) => ({
            fromMember: s.fromMember,
            toMember: s.toMember,
            amount: s.amount,
          })),
        )

        const myBal = AppCalculations.getMyBalance(balances, myMemberId)

        const lastExpense = gExpenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

        return {
          group: g,
          members,
          myBalance: myBal,
          lastActivity: lastExpense?.createdAt?.toISOString(),
          expenseCount: gExpenses.length,
          starred: !!membership?.starredAt,
        }
      })
      .sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''))
  }

  const starredRows = groupRows.filter((r) => r.starred)
  const regularRows = groupRows.filter((r) => !r.starred)

  const { totalOwed, totalOwe, netBalance } = AppCalculations.summarizeMyBalances(groupRows)
  const formattedNetBalance =
    netBalance < 0 ? `-${formatCurrency(Math.abs(netBalance), user.preferredCurrency)}` : formatCurrency(netBalance, user.preferredCurrency)
  const formattedTotalOwed = formatCurrency(totalOwed, user.preferredCurrency)
  const formattedTotalOwe =
    totalOwe > 0 ? `-${formatCurrency(totalOwe, user.preferredCurrency)}` : formatCurrency(totalOwe, user.preferredCurrency)

  return (
    <div className="bc-page">
      <div className="flex items-center justify-between px-4 pt-4 pb-1 min-h-13">
        <div className="bc-wordmark pl-1.5">{tCommon('app_name')}</div>
        <Link
          href={`/${lang}/groups/new`}
          className="bc-tap h-10 rounded-full px-3.5 inline-flex items-center gap-1.5 bg-(--bc-chip) text-(--bc-ink) no-underline"
        >
          <BCIcon name="users" size={18} color="var(--bc-ink)" />
          <span className="font-sans font-medium text-[13px] tracking-[-0.005em]">{tHome('new_group')}</span>
        </Link>
      </div>

      <div className="px-4 pt-2">
        <div className="bg-(--bc-ink) text-(--bc-bg) rounded-[28px] px-5.5 py-5 relative overflow-hidden">
          <div className="font-sans text-[11px] text-[rgba(245,241,234,0.55)] uppercase tracking-[0.14em] mb-1.5">
            {tHome('your_balance')}
          </div>
          <div>
            <div
              className={cn(
                'font-serif text-[60px] leading-[0.95] tabular-nums tracking-[-0.02em]',
                netBalance >= 0 ? 'text-[#E8DCC8]' : 'text-[#F2A788]',
              )}
            >
              {formattedNetBalance}
            </div>
          </div>
          <div className="flex gap-3.5 mt-4.5">
            <div className="flex-1">
              <div className="font-sans text-[11px] opacity-50 tracking-[0.08em] uppercase">{tHome('owed_to_you')}</div>
              <div className="font-mono text-base font-medium mt-1 text-[#9CC8A8] tabular-nums">{formattedTotalOwed}</div>
            </div>
            <div className="w-px bg-[rgba(245,241,234,0.16)]" />
            <div className="flex-1">
              <div className="font-sans text-[11px] opacity-50 tracking-[0.08em] uppercase">{tHome('you_owe')}</div>
              <div className="font-mono text-base font-medium mt-1 text-[#F2A788] tabular-nums">{formattedTotalOwe}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-40 flex flex-col gap-2.5">
        {groupRows.length === 0 ? (
          <div className="py-10 px-5 text-center text-(--bc-muted) font-sans">{tHome('empty')}</div>
        ) : (
          <>
            {starredRows.length > 0 && (
              <>
                <div className="flex items-center justify-between px-1.5 pt-3.5 pb-0.5">
                  <BCSectionLabel>{tHome('starred_section')}</BCSectionLabel>
                </div>
                {starredRows.map((r) => (
                  <GroupRowCard
                    key={r.group.id}
                    row={r}
                    lang={lang}
                    settled={tCommon('settled')}
                    youreOwed={tHome('youre_owed')}
                    youOweShort={tHome('you_owe_short')}
                    lastActivityStr={r.lastActivity ? AppCalculations.relativeTime(r.lastActivity, lang, tCommon) : undefined}
                  />
                ))}
              </>
            )}
            <div className="flex items-center justify-between px-1.5 pt-3.5 pb-0.5">
              <BCSectionLabel>{tHome('groups_section')}</BCSectionLabel>
              <div className="font-sans text-xs text-(--bc-muted)">{tHome('active', { 0: regularRows.length })}</div>
            </div>
            {regularRows.length === 0 ? (
              <div className="py-4 px-5 text-center text-(--bc-muted) font-sans text-sm">{tHome('empty')}</div>
            ) : (
              regularRows.map((r) => (
                <GroupRowCard
                  key={r.group.id}
                  row={r}
                  lang={lang}
                  settled={tCommon('settled')}
                  youreOwed={tHome('youre_owed')}
                  youOweShort={tHome('you_owe_short')}
                  lastActivityStr={r.lastActivity ? AppCalculations.relativeTime(r.lastActivity, lang, tCommon) : undefined}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

type GroupRow = {
  group: {
    id: string
    name: string
    currency: string
    archivedAt: Date | null
  }
  members: { id: string; displayName: string }[]
  myBalance: number
  lastActivity?: string
  expenseCount: number
  starred: boolean
}

function GroupRowCard({
  row,
  lang,
  settled,
  youreOwed,
  youOweShort,
  lastActivityStr,
}: {
  row: GroupRow
  lang: string
  settled: string
  youreOwed: string
  youOweShort: string
  lastActivityStr?: string
}) {
  const { group, members, myBalance, starred } = row
  const { isOwed, isOwing: owes, isSettled } = AppCalculations.getBalanceFlags(myBalance)

  return (
    <div className="relative">
      <Link href={`/${lang}/groups/${group.id}`} className="no-underline block">
        <BCCard padded={false} className="bc-tap px-4 py-3.5 pr-12">
          <div className="flex items-center gap-3.5">
            <BCGroupGlyph name={group.name} size={44} />
            <div className="flex-1 min-w-0">
              <div className="font-sans font-medium text-base text-(--bc-ink) tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">
                {group.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <BCAvatarStack members={members} size={20} max={4} />
                {lastActivityStr && <div className="font-sans text-xs text-(--bc-muted)">· {lastActivityStr}</div>}
              </div>
            </div>
            <div className="text-right">
              {isSettled ? (
                <div className="font-sans text-xs text-(--bc-muted) tracking-[0.06em] uppercase">{settled}</div>
              ) : (
                <>
                  <div className="font-sans text-[10px] text-(--bc-muted) tracking-[0.08em] uppercase whitespace-nowrap">
                    {isOwed ? youreOwed : youOweShort}
                  </div>
                  <div
                    className={cn(
                      'font-serif text-[26px] leading-none tabular-nums tracking-[-0.01em] mt-0.5',
                      isOwed ? 'text-(--bc-pos)' : 'text-(--bc-neg)',
                    )}
                  >
                    {owes ? `-${formatCurrency(Math.abs(myBalance), group.currency)}` : formatCurrency(myBalance, group.currency)}
                  </div>
                </>
              )}
            </div>
          </div>
        </BCCard>
      </Link>
      <StarButton groupId={group.id} lang={lang} starred={starred} />
    </div>
  )
}
