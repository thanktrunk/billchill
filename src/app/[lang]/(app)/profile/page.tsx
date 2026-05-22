import { notFound } from "next/navigation";
import { db } from "@/db";
import { groups, groupMembers, expenses } from "@/db/schema";
import { eq, and, count, sum, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDictionary, hasLocale } from "../../dictionaries";
import { BCIcon, BCAvatar, BCSectionLabel } from "@/components/bc-ui";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: PageProps<"/[lang]/profile">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, dict] = await Promise.all([requireUser(), getDictionary(lang)]);
  const t = dict.profile as Record<string, string>;

  // Fetch stats
  const myMemberships = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id));

  const groupIds = myMemberships.map((m) => m.groupId);

  const [groupsCount, expensesCount, paidExpenses] = await Promise.all([
    Promise.resolve(groupIds.length),
    groupIds.length
      ? db
          .select({ count: count() })
          .from(expenses)
          .where(inArray(expenses.groupId, groupIds))
          .then((r) => r[0]?.count ?? 0)
      : Promise.resolve(0),
    groupIds.length
      ? db
          .select({ total: sum(expenses.amount) })
          .from(expenses)
          .where(
            and(
              inArray(expenses.groupId, groupIds),
              eq(expenses.paidBy,
                // We need to find the member ids for this user
                // For now let's just compute it differently
                user.id // this won't match — paidBy is memberId not userId
              )
            )
          )
          .then((r) => parseFloat(r[0]?.total ?? "0"))
      : Promise.resolve(0),
  ]);

  // Get user's member ids to compute total lent correctly
  const myMemberIds = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id));

  const memberIdList = myMemberIds.map((m) => m.id);

  const totalLent = memberIdList.length && groupIds.length
    ? await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(inArray(expenses.paidBy, memberIdList))
        .then((r) => parseFloat(r[0]?.total ?? "0"))
    : 0;

  const sym = ({ USD: "$", EUR: "€", GBP: "£", JPY: "¥" } as Record<string, string>)["USD"] ?? "$";

  // Get archived groups count
  const allGroups = groupIds.length
    ? await db.select({ archivedAt: groups.archivedAt }).from(groups).where(inArray(groups.id, groupIds))
    : [];
  const archivedCount = allGroups.filter((g) => g.archivedAt).length;

  const languages = [
    { code: "en", label: "English" },
    { code: "vi", label: "Tiếng Việt" },
  ];

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
      <div style={{ padding: "16px 20px 4px" }}>
        <BCSectionLabel>{t.title ?? "Profile"}</BCSectionLabel>
      </div>

      {/* User card */}
      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            background: "var(--bc-surface)",
            borderRadius: 20,
            padding: "18px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <BCAvatar seed={user.id} name={user.displayName} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-newsreader), serif",
                fontSize: 22,
                color: "var(--bc-ink)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.displayName}
            </div>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 13,
                color: "var(--bc-muted)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {[
            { label: t.stat_groups ?? "Groups", value: String(groupsCount) },
            { label: t.stat_expenses ?? "Expenses", value: String(expensesCount) },
            { label: t.stat_total_lent ?? "Total lent", value: `${sym}${totalLent.toFixed(0)}` },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--bc-surface)",
                borderRadius: 16,
                padding: "14px 14px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-newsreader), serif",
                  fontSize: 28,
                  color: "var(--bc-ink)",
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 10,
                  color: "var(--bc-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ marginBottom: 8, paddingLeft: 4 }}>
          <BCSectionLabel>{t.preferences ?? "Preferences"}</BCSectionLabel>
        </div>
        <div style={{ background: "var(--bc-surface)", borderRadius: 20, overflow: "hidden" }}>
          {/* Language */}
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--bc-softhair)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 15,
                color: "var(--bc-ink)",
              }}
            >
              {t.language ?? "Language"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {languages.map((l) => (
                <Link
                  key={l.code}
                  href={`/${l.code}/profile`}
                  style={{
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontSize: 13,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: lang === l.code ? "var(--bc-ink)" : "var(--bc-chip)",
                    color: lang === l.code ? "var(--bc-bg)" : "var(--bc-muted)",
                    textDecoration: "none",
                    fontWeight: lang === l.code ? 500 : 400,
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications toggle row */}
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--bc-softhair)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 15,
                color: "var(--bc-ink)",
              }}
            >
              {t.notifications ?? "Notifications"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 13,
                color: "var(--bc-muted)",
              }}
            >
              {t.all_on ?? "All on"}
            </div>
          </div>

          {/* Appearance row */}
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 15,
                color: "var(--bc-ink)",
              }}
            >
              {t.appearance ?? "Appearance"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 13,
                color: "var(--bc-muted)",
              }}
            >
              {t.auto ?? "Auto"}
            </div>
          </div>
        </div>
      </div>

      {/* Archived groups */}
      {archivedCount > 0 && (
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ background: "var(--bc-surface)", borderRadius: 20, overflow: "hidden" }}>
            <div
              style={{
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                  fontSize: 15,
                  color: "var(--bc-ink)",
                }}
              >
                {t.archived_groups ?? "Archived groups"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontSize: 13,
                    color: "var(--bc-muted)",
                  }}
                >
                  {archivedCount}
                </span>
                <BCIcon name="arrowR" size={14} color="var(--bc-muted)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ background: "var(--bc-surface)", borderRadius: 20, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--bc-softhair)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 13,
                color: "var(--bc-muted)",
              }}
            >
              {t.signed_in_as ?? "Signed in as"} {user.email}
            </div>
          </div>
          <Link
            href="/auth/logout"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 15,
                color: "var(--bc-neg)",
                fontWeight: 500,
              }}
            >
              {t.logout ?? "Log out"}
            </div>
            <BCIcon name="arrowR" size={14} color="var(--bc-neg)" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "24px 20px 160px",
          textAlign: "center",
          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          fontSize: 11,
          color: "var(--bc-muted)",
          letterSpacing: "0.08em",
        }}
      >
        {dict.common.app_footer ?? "billchill · v1.0"}
      </div>
    </div>
  );
}
