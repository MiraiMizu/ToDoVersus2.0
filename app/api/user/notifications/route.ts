export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matches } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get incoming pending matches
    const db = getDb()
    const pendingMatchesArray = await db.select({ count: count() }).from(matches).where(
      and(
        eq(matches.opponentId, session.user.id),
        eq(matches.status, 'PENDING')
      )
    )
    const pendingMatches = pendingMatchesArray[0].count

    return NextResponse.json({ notifications: { pendingMatches } })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
