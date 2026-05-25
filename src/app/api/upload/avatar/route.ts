import { put, del } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { setUserAvatarUrl } from '@/db/mutations/profile'
import { AVATAR_MAX_BYTES } from '@/lib/utils'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

export async function POST(request: Request) {
  const user = await requireUser()

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'bad_type' }, { status: 400 })
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 400 })
  }

  const ext = MIME_TO_EXT[file.type] ?? 'jpg'
  const env = process.env.VERCEL_ENV ?? 'local'
  const pathname = `${env}/avatars/${user.id}-${Date.now()}.${ext}`

  const [blob] = await Promise.all([
    put(pathname, file, { access: 'public', addRandomSuffix: false }),
    user.avatarUrl?.includes('blob.vercel-storage.com') ? del(user.avatarUrl).catch(() => {}) : Promise.resolve(),
  ])

  await setUserAvatarUrl(user.id, blob.url)

  return NextResponse.json({ url: blob.url })
}
