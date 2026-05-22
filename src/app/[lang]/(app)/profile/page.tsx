import { notFound } from "next/navigation";
import { db } from "@/db";
import { groups, groupMembers, expenses } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { hasLocale } from "@/lib/i18n";
import { BCIcon, BCAvatar, BCCard, BCSectionLabel } from "@/components/bc-ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

function GroupGlyph({ name, size = 32 }: { name: string; size?: number }) {
  const ch = (name || "?").trim().charAt(0).toUpperCase();
  const colors = ["#E5572F","#3F6E55","#B7873A","#7B5E8C","#4A6B7C","#A4452C","#5B6E3F","#8C5E3E"];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = colors[Math.abs(hash) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-newsreader), serif", fontSize: size * 0.55,
      letterSpacing: "-0.02em", flexShrink: 0,
    }}>{ch}</div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <BCCard padded={false} style={{ padding: "14px 14px" }}>
      <div style={{
        fontFamily: "var(--font-be-vietnam-pro), sans-serif",
        fontSize: 10, color: "var(--bc-muted)",
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontFamily: "var(--font-newsreader), serif",
        fontSize: 30, color: "var(--bc-ink)",
        lineHeight: 1.1, letterSpacing: "-0.015em",
        marginTop: 6, fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
    </BCCard>
  );
}

export default async function ProfilePage({
  params,
}: PageProps<"/[lang]/profile">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, t] = await Promise.all([requireUser(), getTranslations("profile")]);

  const myMemberships = await db
    .select({ groupId: groupMembers.groupId, memberId: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id));

  const groupIds = myMemberships.map((m) => m.groupId);
  const memberIds = myMemberships.map((m) => m.memberId);

  const [allExpenses, allGroups] = await Promise.all([
    groupIds.length
      ? db.select({ amount: expenses.amount, paidBy: expenses.paidBy }).from(expenses).where(inArray(expenses.groupId, groupIds))
      : Promise.resolve([]),
    groupIds.length
      ? db.select({ id: groups.id, name: groups.name, archivedAt: groups.archivedAt }).from(groups).where(inArray(groups.id, groupIds))
      : Promise.resolve([]),
  ]);

  const activeGroups = allGroups.filter((g) => !g.archivedAt);
  const archivedGroups = allGroups.filter((g) => g.archivedAt);
  const totalLent = allExpenses
    .filter((e) => memberIds.includes(e.paidBy))
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  const sym = "$";

  const prefRows = [
    { label: t("language"),            value: lang === "vi" ? "Tiếng Việt" : "English", href: lang === "vi" ? "/en/profile" : "/vi/profile" },
    { label: t("default_currency"),    value: "USD" },
    { label: t("notifications"),       value: t("all_on") },
    { label: t("appearance"),          value: t("auto") },
    { label: t("connected_accounts"),  value: "1" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100dvh", background: "var(--bc-bg)", color: "var(--bc-ink)",
    }}>
      {/* Top bar */}
      <div style={{ padding: "8px 16px 4px", minHeight: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          fontFamily: "var(--font-newsreader), serif",
          fontSize: 28, color: "var(--bc-ink)",
          paddingLeft: 6, letterSpacing: "-0.015em",
        }}>
          {t("title")}
        </div>
        <div style={{ width: 40, height: 40 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 160px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* User card */}
        <BCCard>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BCAvatar name={user.displayName} seed={user.id} size={56} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontWeight: 500, fontSize: 17, color: "var(--bc-ink)",
                letterSpacing: "-0.005em",
              }}>
                {user.displayName}
              </div>
              <div style={{
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 13, color: "var(--bc-muted)", marginTop: 2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {user.email}
              </div>
            </div>
          </div>
        </BCCard>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Stat label={t("stat_groups")} value={String(activeGroups.length)} />
          <Stat label={t("stat_expenses")} value={String(allExpenses.length)} />
          <Stat label={t("stat_total_lent")} value={`${sym}${totalLent.toFixed(0)}`} />
        </div>

        {/* Preferences */}
        <div>
          <div style={{ padding: "4px 4px 8px" }}>
            <BCSectionLabel>{t("preferences")}</BCSectionLabel>
          </div>
          <BCCard padded={false}>
            {prefRows.map((r, i) => {
              const inner = (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px",
                  borderTop: i === 0 ? "none" : "1px solid var(--bc-softhair)",
                  cursor: r.href ? "pointer" : "default",
                }}>
                  <div style={{
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontSize: 15, color: "var(--bc-ink)",
                  }}>{r.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontSize: 14, color: "var(--bc-muted)",
                    }}>{r.value}</div>
                    <BCIcon name="arrowR" size={14} color="var(--bc-muted)" strokeWidth={1.6} />
                  </div>
                </div>
              );
              return r.href ? (
                <Link key={r.label} href={r.href} style={{ textDecoration: "none" }}>
                  {inner}
                </Link>
              ) : (
                <div key={r.label}>{inner}</div>
              );
            })}
          </BCCard>
        </div>

        {/* Archived groups */}
        {archivedGroups.length > 0 && (
          <div>
            <div style={{ padding: "4px 4px 8px" }}>
              <BCSectionLabel>{t("archived_groups")}</BCSectionLabel>
            </div>
            <BCCard padded={false}>
              {archivedGroups.map((g, i) => (
                <div key={g.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--bc-softhair)",
                }}>
                  <GroupGlyph name={g.name} size={32} />
                  <div style={{
                    flex: 1, fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontWeight: 500, fontSize: 14, color: "var(--bc-ink)",
                  }}>{g.name}</div>
                  <div style={{
                    fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                    fontSize: 11, color: "var(--bc-muted)",
                    letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>{t("archived")}</div>
                </div>
              ))}
            </BCCard>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: "center", padding: 12,
          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          fontSize: 11, color: "var(--bc-muted)",
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          billchill · v1.0
        </div>

        {/* Logout */}
        <a
          href={`/auth/logout?returnTo=${process.env.APP_BASE_URL ?? ""}/${lang}`}
          className="bc-tap"
          style={{
            background: "transparent",
            color: "var(--bc-neg)",
            border: "1px solid var(--bc-softhair)",
            padding: "14px 22px",
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            fontWeight: 500,
            fontSize: 15,
            letterSpacing: "-0.005em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <BCIcon name="back" size={16} color="var(--bc-neg)" strokeWidth={1.8} />
          {t("logout")}
        </a>
      </div>
    </div>
  );
}
