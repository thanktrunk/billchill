import { notFound } from 'next/navigation'
import { hasLocale } from '@/lib/i18n'
import { NewGroupForm } from './new-group-form'

export default async function NewGroupPage({ params }: PageProps) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return <NewGroupForm />
}
