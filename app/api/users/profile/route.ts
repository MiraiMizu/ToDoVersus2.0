export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { motto } = await request.json()

    if (motto && motto.length > 100) {
      return NextResponse.json({ error: 'Motto must be 100 characters or less' }, { status: 400 })
    }

    const db = getDb()
    const dataToUpdate: any = {}
    if (motto !== undefined) dataToUpdate.motto = motto

    const result = Object.keys(dataToUpdate).length > 0
      ? await db.update(users).set(dataToUpdate).where(eq(users.id, session.user.id)).returning({
          id: users.id,
          username: users.username,
          motto: users.motto,
          rank: users.rank
        })
      : await db.select({
          id: users.id,
          username: users.username,
          motto: users.motto,
          rank: users.rank
        }).from(users).where(eq(users.id, session.user.id))
        
    const updatedUser = result[0]

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
