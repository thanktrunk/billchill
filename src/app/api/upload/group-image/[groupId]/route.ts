import { put, del } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { verifyGroupMembership } from '@/lib/access-control'
import { setGroupImageUrl } from '@/db/mutations/groups'
import { getGroupDetailData } from '@/db/queries/groups'
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

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await requireUser()
  const { groupId } = await params

  await verifyGroupMembership(groupId, user.id)

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

  const { group } = await getGroupDetailData(groupId)
  if (!group) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ext = MIME_TO_EXT[file.type] ?? 'jpg'
  const env = process.env.VERCEL_ENV ?? 'local'
  const pathname = `${env}/group-images/${groupId}-${Date.now()}.${ext}`

  const [blob] = await Promise.all([
    put(pathname, file, { access: 'public', addRandomSuffix: false }),
    group.imageUrl?.includes('blob.vercel-storage.com') ? del(group.imageUrl).catch(() => {}) : Promise.resolve(),
  ])

  await setGroupImageUrl(groupId, blob.url)

  return NextResponse.json({ url: blob.url })
}
