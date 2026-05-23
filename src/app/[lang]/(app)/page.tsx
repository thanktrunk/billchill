import { redirect } from 'next/navigation'

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params
  redirect(`/${lang}/groups`)
}
