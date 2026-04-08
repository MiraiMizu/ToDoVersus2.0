export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matches } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
      with: {
        challenger: { columns: { id: true, username: true, avatarUrl: true, rank: true, streak: true } },
        opponent: { columns: { id: true, username: true, avatarUrl: true, rank: true, streak: true } },
        bet: true,
        matchTasks: { with: { category: true } },
        winner: { columns: { id: true, username: true } },
        activityLogs: {
          with: { user: { columns: { id: true, username: true } }, category: true },
          orderBy: (logs: any, { desc }: any) => [desc(logs.loggedAt)],
        },
        dailyScores: {
          orderBy: (scores: any, { desc }: any) => [desc(scores.date)],
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Only participants can see match details
    if (match.challengerId !== session.user.id && match.opponentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Get match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
