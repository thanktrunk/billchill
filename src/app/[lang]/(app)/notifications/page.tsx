import { db } from "@/db";
import { notifications, groups } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { markAllAsRead } from "./actions";
import { BCIcon } from "@/components/bc-ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

const TYPE_ICON: Record<string, string> = {
  expense_added: "receipt",
  settlement_recorded: "check",
  member_added: "users",
};

export default async function NotificationsPage({
  params,
}: PageProps<"/[lang]/notifications">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, t] = await Promise.all([requireUser(), getTranslations("activity")]);

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const groupIds = [...new Set(userNotifications.map((n) => n.groupId))];
  const groupRows = groupIds.length
    ? await db.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, groupIds))
    : [];
  const groupMap = new Map(groupRows.map((g) => [g.id, g.name]));

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const typeLabel: Record<string, string> = {
    expense_added: t("type_expense"),
    settlement_recorded: t("type_payment"),
    member_added: t("type_joined"),
  };

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
          padding: "8px 16px 4px",
          minHeight: 52,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-newsreader), serif",
            fontSize: 28,
            color: "var(--bc-ink)",
            paddingLeft: 6,
            letterSpacing: "-0.015em",
          }}
        >
          {t("title")}
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead.bind(null, lang)}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                width: 40,
                height: 40,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={t("mark_all_read")}
            >
              <BCIcon name="check" size={20} color="var(--bc-ink)" />
            </button>
          </form>
        )}
      </div>

      {/* Notification list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 16px 160px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {userNotifications.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--bc-muted)",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
            }}
          >
            {t("empty")}
          </div>
        ) : (
          userNotifications.map((n) => {
            const groupName = groupMap.get(n.groupId);
            const iconName = TYPE_ICON[n.type] ?? "bell";
            const label = typeLabel[n.type] ?? n.type;
            const time = relativeTime(n.createdAt.toISOString(), lang).toUpperCase();

            return (
              <Link
                key={n.id}
                href={`/${lang}/groups/${n.groupId}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: n.isRead ? "var(--bc-surface)" : "var(--bc-bg)",
                    border: `1px solid var(--bc-softhair)`,
                    borderRadius: 22,
                    padding: "14px 16px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: "var(--bc-chip)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <BCIcon name={iconName} size={18} color="var(--bc-ink)" strokeWidth={1.6} />
                      {!n.isRead && (
                        <div
                          style={{
                            position: "absolute",
                            top: -1,
                            right: -1,
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: "var(--bc-accent)",
                            boxShadow: "0 0 0 2px var(--bc-bg)",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                          marginBottom: 4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                            fontSize: 10,
                            color: "var(--bc-muted)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 500,
                            flexShrink: 0,
                          }}
                        >
                          {label}
                        </div>
                        {groupName && (
                          <div
                            style={{
                              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                              fontSize: 11,
                              color: "var(--bc-muted)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            · {groupName}
                          </div>
                        )}
                        <div style={{ flex: 1 }} />
                        <div
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            fontSize: 10,
                            color: "var(--bc-muted)",
                            letterSpacing: "0.04em",
                            flexShrink: 0,
                          }}
                        >
                          {time}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                          fontSize: 14.5,
                          color: "var(--bc-ink)",
                          letterSpacing: "-0.005em",
                          lineHeight: 1.35,
                        }}
                      >
                        {n.message}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
