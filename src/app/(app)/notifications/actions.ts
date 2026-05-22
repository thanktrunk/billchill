"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAsRead(notificationId: string) {
  const user = await requireUser();

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id)
      )
    );

  revalidatePath("/notifications");
}
