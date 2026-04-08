export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { or, like } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const db = getDb()
    const usersList = await db.query.users.findMany({
      where: or(
        like(users.username, `%${q}%`),
        like(users.email, `%${q}%`)
      ),
      columns: { id: true, username: true, avatarUrl: true, rank: true, allTimeScore: true },
      limit: 10,
    })

    return NextResponse.json({ users: usersList })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
