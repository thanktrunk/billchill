import Link from "next/link";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { markAsRead } from "./actions";

export default async function NotificationsPage() {
  const user = await requireUser();

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {userNotifications.length === 0 ? (
        <p className="text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {userNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                !notification.isRead ? "bg-accent/50" : ""
              }`}
            >
              <div>
                <p className={!notification.isRead ? "font-medium" : ""}>
                  {notification.message}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!notification.isRead && (
                  <form action={markAsRead.bind(null, notification.id)}>
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Mark read
                    </button>
                  </form>
                )}
                <Link
                  href={`/groups/${notification.groupId}`}
                  className="text-xs text-primary hover:underline"
                >
                  View group
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
