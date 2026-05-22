"use server";

import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function createGroup(formData: FormData) {
  const user = await requireUser();
  const name = formData.get("name") as string;
  const currency = formData.get("currency") as string;

  if (!name?.trim()) {
    throw new Error("Group name is required");
  }

  const [group] = await db
    .insert(groups)
    .values({
      name: name.trim(),
      currency: currency || "USD",
      createdBy: user.id,
    })
    .returning();

  // Add creator as a member
  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: user.id,
    displayName: user.displayName,
  });

  return group;
}
