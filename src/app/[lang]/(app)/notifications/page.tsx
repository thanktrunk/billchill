import Link from "next/link";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDictionary, hasLocale } from "../../dictionaries";
import { notFound } from "next/navigation";
import { markAsRead, markAllAsRead } from "./actions";
import { BCIcon, BCSectionLabel } from "@/components/bc-ui";

function relativeTime(iso: string, lang: string): string {
  const now = new Date();
  const t = new Date(iso);
  const diff = (now.getTime() - t.getTime()) / 1000;
  if (diff < 60) return lang === "vi" ? "vừa xong" : "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "vi" ? `${m} ph` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === "vi" ? `${h} g` : `${h}h ago`;
  }
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return lang === "vi" ? `${d} ng` : `${d}d ago`;
  }
  return t.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" });
}

const TYPE_LABEL: Record<string, string> = {
  expense_added: "expense",
  settlement_recorded: "payment",
  member_added: "joined",
};

const TYPE_LABEL_VI: Record<string, string> = {
  expense_added: "chi tiêu",
  settlement_recorded: "thanh toán",
  member_added: "tham gia",
};

export default async function NotificationsPage({
  params,
}: PageProps<"/[lang]/notifications">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, dict] = await Promise.all([requireUser(), getDictionary(lang)]);

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;
  const t = dict.activity as Record<string, string>;

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
          padding: "16px 20px 4px",
          minHeight: 52,
        }}
      >
        <BCSectionLabel>{t.title ?? "Activity"}</BCSectionLabel>
        {unreadCount > 0 && (
          <form action={markAllAsRead.bind(null, lang)}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                fontSize: 12,
                color: "var(--bc-accent)",
                letterSpacing: "0.02em",
                padding: "6px 2px",
              }}
            >
              {t.mark_all_read ?? "Mark all read"}
            </button>
          </form>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: "8px 16px 160px", display: "flex", flexDirection: "column", gap: 2 }}>
        {userNotifications.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--bc-muted)",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: 14,
            }}
          >
            {t.empty ?? "No activity yet."}
          </div>
        ) : (
          userNotifications.map((n) => {
            const typeLabel = lang === "vi"
              ? TYPE_LABEL_VI[n.type] ?? n.type
              : TYPE_LABEL[n.type] ?? n.type;

            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: !n.isRead ? "var(--bc-surface)" : "transparent",
                  position: "relative",
                }}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <div
                    style={{
                      position: "absolute",
                      left: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 5,
                      height: 5,
                      borderRadius: 999,
                      background: "var(--bc-accent)",
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--bc-chip)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BCIcon
                    name={n.type === "settlement_recorded" ? "swap" : n.type === "member_added" ? "users" : "receipt"}
                    size={16}
                    color="var(--bc-muted)"
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                        fontSize: 11,
                        color: "var(--bc-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span style={{ color: "var(--bc-hair)", fontSize: 10 }}>·</span>
                    <span
                      style={{
                        fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                        fontSize: 11,
                        color: "var(--bc-muted)",
                      }}
                    >
                      {relativeTime(n.createdAt.toISOString(), lang)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontSize: 14,
                      color: "var(--bc-ink)",
                      fontWeight: !n.isRead ? 500 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {n.message}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <Link
                    href={`/${lang}/groups/${n.groupId}`}
                    style={{
                      fontFamily: "var(--font-be-vietnam-pro), sans-serif",
                      fontSize: 11,
                      color: "var(--bc-accent)",
                      textDecoration: "none",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <BCIcon name="arrowR" size={14} color="var(--bc-accent)" />
                  </Link>
                  {!n.isRead && (
                    <form action={markAsRead.bind(null, lang, n.id)}>
                      <button
                        type="submit"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Mark read"
                      >
                        <BCIcon name="check" size={14} color="var(--bc-muted)" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
