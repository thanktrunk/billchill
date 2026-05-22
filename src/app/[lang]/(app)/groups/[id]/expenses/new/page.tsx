import { notFound } from "next/navigation";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { verifyGroupMembership } from "@/lib/access-control";
import { getDictionary, hasLocale } from "../../../../../dictionaries";
import { NewExpenseForm } from "./new-expense-form";

export default async function NewExpensePage({
  params,
}: PageProps<"/[lang]/groups/[id]/expenses/new">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const [user, dict] = await Promise.all([requireUser(), getDictionary(lang)]);
  await verifyGroupMembership(id, user.id);

  const group = await db.query.groups.findFirst({ where: eq(groups.id, id) });
  if (!group) notFound();

  return (
    <NewExpenseForm
      lang={lang}
      groupId={id}
      groupName={group.name}
      currency={group.currency}
      dict={dict.new_expense as unknown as Record<string, string>}
    />
  );
}
