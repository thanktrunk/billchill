import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../../dictionaries";
import { NewGroupForm } from "./new-group-form";

export default async function NewGroupPage({
  params,
}: PageProps<"/[lang]/groups/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  return <NewGroupForm lang={lang} dict={dict.new_group} />;
}
