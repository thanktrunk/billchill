import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      currency: groups.currency,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, user.id));

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Groups</h1>
        <Link
          href="/groups/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Group
        </Link>
      </div>

      {userGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No groups yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userGroups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{group.name}</h2>
                <span className="text-sm text-muted-foreground">
                  {group.currency}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
