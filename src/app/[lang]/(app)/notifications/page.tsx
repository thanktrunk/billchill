import { db } from "@/db";
import { notifications, groups } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { markAllAsRead } from "./actions";
import { BCIcon } from "@/components/bc-ui";
import { cn } from "@/lib/utils";
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
    <div className="bc-page">
      <div className="flex items-center justify-between px-4 pt-2 pb-1 min-h-13">
        <div className="bc-wordmark pl-1.5">
          {t("title")}
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead.bind(null, lang)}>
            <button
              type="submit"
              className="bc-tap w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center"
              title={t("mark_all_read")}
            >
              <BCIcon name="check" size={20} color="var(--bc-ink)" />
            </button>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2.5 pb-40 flex flex-col gap-2">
        {userNotifications.length === 0 ? (
          <div className="py-10 px-5 text-center text-(--bc-muted) font-sans">
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
                className="no-underline"
              >
                <div
                  className={cn(
                    "border border-(--bc-softhair) rounded-[22px] px-4 py-3.5 cursor-pointer",
                    n.isRead ? "bg-(--bc-surface)" : "bg-(--bc-bg)",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-(--bc-chip) flex items-center justify-center shrink-0 relative">
                      <BCIcon name={iconName} size={18} color="var(--bc-ink)" strokeWidth={1.6} />
                      {!n.isRead && (
                        <div className="absolute -top-px -right-px w-2.5 h-2.5 rounded-full bg-(--bc-accent) shadow-[0_0_0_2px_var(--bc-bg)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="flex items-baseline gap-1.5 mb-1 whitespace-nowrap overflow-hidden"
                      >
                        <div className="font-sans text-[10px] text-(--bc-muted) tracking-[0.12em] uppercase font-medium shrink-0">
                          {label}
                        </div>
                        {groupName && (
                          <div className="font-sans text-[11px] text-(--bc-muted) whitespace-nowrap overflow-hidden text-ellipsis">
                            · {groupName}
                          </div>
                        )}
                        <div className="flex-1" />
                        <div className="font-mono text-[10px] text-(--bc-muted) tracking-[0.04em] shrink-0">
                          {time}
                        </div>
                      </div>
                      <div className="font-sans text-[14.5px] text-(--bc-ink) tracking-[-0.005em] leading-[1.35]">
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
