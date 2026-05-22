import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function verifyGroupMembership(groupId: string, userId: string) {
  const member = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, userId)
    ),
  });

  if (!member) {
    throw new Error("Forbidden: not a member of this group");
  }

  return member;
}
