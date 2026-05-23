import { auth0 } from '@/lib/auth0'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function getCurrentUser() {
  const session = await auth0.getSession()
  if (!session?.user) return null

  const { sub, email, name, picture } = session.user

  // Upsert user in database
  const [dbUser] = await db
    .insert(users)
    .values({
      auth0Id: sub as string,
      email: (email as string) || '',
      displayName: (name as string) || (email as string) || 'User',
      avatarUrl: (picture as string) || null,
    })
    .onConflictDoUpdate({
      target: users.auth0Id,
      set: {
        email: (email as string) || '',
        avatarUrl: (picture as string) || null,
      },
    })
    .returning()

  return dbUser
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
