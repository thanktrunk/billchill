import { notFound } from 'next/navigation'
import { hasLocale } from '@/lib/i18n'
import { requireUser } from '@/lib/auth'
import { NewGroupForm } from './new-group-form'

export default async function NewGroupPage({ params }: PageProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const user = await requireUser()

  return <NewGroupForm defaultCurrency={user.preferredCurrency} />
}
