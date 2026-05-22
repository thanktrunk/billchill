import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers, expenses, expenseSplits, settlements } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getDictionary, hasLocale } from "../../dictionaries";
import { notFound } from "next/navigation";
import { calculateBalances } from "@/lib/balance";
import { BCIcon, BCGroupGlyph, BCAvatarStack, BCCard, BCSectionLabel } from "@/components/bc-ui";

function currencySymbol(code: string) {
  return ({ USD: "$", EUR: "€", GBP: "£", JPY: "¥" } as Record<string, string>)[code] ?? code;
}

function relativeTime(iso: string, lang: string): string {
  const now = new Date();
  const t = new Date(iso);
  const diff = (now.getTime() - t.getTime()) / 1000;
  if (diff < 60) return lang === "vi" ? "vừa xong" : "now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "vi" ? `${m} ph` : `${m}m`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === "vi" ? `${h} g` : `${h}h`;
  }
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return lang === "vi" ? `${d} ng` : `${d}d`;
  }
  return t.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function GroupsPage({
  params,
}: PageProps<"/[lang]/groups">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, dict] = await Promise.all([
    requireUser(),
    getDictionary(lang),
  ]);

  // Get user's memberships
  const myMemberships = await db
    .select({ groupId: groupMembers.groupId, myMemberId: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id));

  const groupIds = myMemberships.map((m) => m.groupId);
  const membershipMap = new Map(myMemberships.map((m) => [m.groupId, m.myMemberId]));

  let groupRows: GroupRow[] = [];

  if (groupIds.length > 0) {
    const [allGroups, allMembers, allExpenses, allSettlements] = await Promise.all([
      db.select().from(groups).where(inArray(groups.id, groupIds)),
      db.select().from(groupMembers).where(
        and(inArray(groupMembers.groupId, groupIds), eq(groupMembers.isActive, true))
      ),
      db.select().from(expenses).where(inArray(expenses.groupId, groupIds)),
      db.select().from(settlements).where(inArray(settlements.groupId, groupIds)),
    ]);

    const expenseIds = allExpenses.map((e) => e.id);
    const allSplits = expenseIds.length > 0
      ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
      : [];

    groupRows = allGroups
      .filter((g) => !g.archivedAt)
      .map((g) => {
        const members = allMembers.filter((m) => m.groupId === g.id);
        const gExpenses = allExpenses.filter((e) => e.groupId === g.id);
        const gSettlements = allSettlements.filter((s) => s.groupId === g.id);

        const myMemberId = membershipMap.get(g.id);
        const expensesWithSplits = gExpenses.map((e) => ({
          paidBy: e.paidBy,
          splits: allSplits
            .filter((s) => s.expenseId === e.id)
            .map((s) => ({ memberId: s.memberId, shareAmount: s.shareAmount })),
        }));

        const balances = calculateBalances(
          members.map((m) => ({ id: m.id, displayName: m.displayName })),
          expensesWithSplits,
          gSettlements.map((s) => ({
            fromMember: s.fromMember,
            toMember: s.toMember,
            amount: s.amount,
          }))
        );

        const myBal = myMemberId
          ? (balances.find((b) => b.memberId === myMemberId)?.balance ?? 0)
          : 0;

        const lastExpense = gExpenses.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        )[0];

        return {
          group: g,
          members,
          myBalance: myBal,
          lastActivity: lastExpense?.createdAt?.toISOString(),
          expenseCount: gExpenses.length,
        };
      })
      .sort((a, b) =>
        (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "")
      );
  }

  const totalOwed = groupRows.reduce((s, r) => s + Math.max(0, r.myBalance), 0);
  const totalOwe  = groupRows.reduce((s, r) => s + Math.max(0, -r.myBalance), 0);
  const netBalance = totalOwed - totalOwe;
  const heroCurrency = currencySymbol(groupRows[0]?.group?.currency ?? "USD");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--bc-bg)",
        color: "var(--bc-ink)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 4px",
          minHeight: 52,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 28,
            color: "var(--bc-ink)",
            letterSpacing: "-0.015em",
            paddingLeft: 6,
          }}
        >
          {dict.common.app_name}
        </div>
        <Link
          href={`/${lang}/groups/new`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--bc-ink)",
          }}
          className="bc-tap"
        >
          <BCIcon name="users" size={20} color="var(--bc-ink)" />
        </Link>
      </div>

      {/* Balance hero */}
      <div style={{ padding: "8px 16px 0" }}>
        <div
          style={{
            background: "var(--bc-ink)",
            color: "var(--bc-bg)",
            borderRadius: 28,
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 11,
              color: "rgba(245,241,234,0.55)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: 6,
            }}
          >
            {dict.home.your_balance}
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 60,
                lineHeight: 0.95,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
                color: netBalance >= 0 ? "#E8DCC8" : "#F2A788",
              }}
            >
              <span style={{ fontSize: 32, opacity: 0.6, marginRight: 4 }}>{heroCurrency}</span>
              {Math.abs(netBalance).toFixed(2).split(".")[0]}
              <span style={{ fontSize: 32, opacity: 0.55 }}>
                .{Math.abs(netBalance).toFixed(2).split(".")[1]}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 11,
                  opacity: 0.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {dict.home.owed_to_you}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 16,
                  fontWeight: 500,
                  marginTop: 4,
                  color: "#9CC8A8",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {heroCurrency}{totalOwed.toFixed(2)}
              </div>
            </div>
            <div style={{ width: 1, background: "rgba(245,241,234,0.16)" }} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 11,
                  opacity: 0.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {dict.home.you_owe}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: 16,
                  fontWeight: 500,
                  marginTop: 4,
                  color: "#F2A788",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {heroCurrency}{totalOwe.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Groups section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 22px 10px",
        }}
      >
        <BCSectionLabel>{dict.home.groups_section}</BCSectionLabel>
        <div
          style={{
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontSize: 12,
            color: "var(--bc-muted)",
          }}
        >
          {dict.home.active.replace("{0}", String(groupRows.length))}
        </div>
      </div>

      {/* Group list */}
      <div
        style={{
          flex: 1,
          padding: "0 16px 160px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {groupRows.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--bc-muted)",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            }}
          >
            {dict.home.empty}
          </div>
        ) : (
          groupRows.map((r) => (
            <GroupRowCard
              key={r.group.id}
              row={r}
              lang={lang}
              dict={dict}
            />
          ))
        )}
      </div>
    </div>
  );
}

type GroupRow = {
  group: { id: string; name: string; currency: string; archivedAt: Date | null };
  members: { id: string; displayName: string }[];
  myBalance: number;
  lastActivity?: string;
  expenseCount: number;
};

function GroupRowCard({
  row,
  lang,
  dict,
}: {
  row: GroupRow;
  lang: string;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const { group, members, myBalance, lastActivity } = row;
  const sym = currencySymbol(group.currency);
  const isOwed = myBalance > 0.005;
  const owes = myBalance < -0.005;
  const settled = !isOwed && !owes;

  return (
    <Link href={`/${lang}/groups/${group.id}`} style={{ textDecoration: "none" }}>
      <BCCard padded={false} style={{ padding: "14px 16px" }} className="bc-tap">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BCGroupGlyph name={group.name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontWeight: 500,
                fontSize: 16,
                color: "var(--bc-ink)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {group.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <BCAvatarStack members={members} size={20} max={4} />
              {lastActivity && (
                <div
                  style={{
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontSize: 12,
                    color: "var(--bc-muted)",
                  }}
                >
                  · {relativeTime(lastActivity, lang)}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {settled ? (
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 12,
                  color: "var(--bc-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {dict.common.settled}
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontSize: 10,
                    color: "var(--bc-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isOwed ? dict.home.youre_owed : dict.home.you_owe_short}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-newsreader), serif",
                    fontSize: 26,
                    lineHeight: 1,
                    color: isOwed ? "var(--bc-pos)" : "var(--bc-neg)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.01em",
                    marginTop: 2,
                  }}
                >
                  {sym}{Math.abs(myBalance).toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>
      </BCCard>
    </Link>
  );
}
