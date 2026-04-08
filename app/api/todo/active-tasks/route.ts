export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matches } from '@/db/schema'
import { eq, or, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const activeMatches = await db.query.matches.findMany({
      where: and(
        or(
          eq(matches.challengerId, session.user.id),
          eq(matches.opponentId, session.user.id)
        ),
        eq(matches.status, 'ACTIVE')
      ),
      with: {
        matchTasks: {
          where: (tasks: any, { eq }: any) => eq(tasks.userId, session!.user!.id),
          with: { category: true }
        },
        challenger: { columns: { id: true, username: true } },
        opponent: { columns: { id: true, username: true } }
      }
    })

    const allTasks = activeMatches.flatMap((match: any) =>
      match.matchTasks.map((task: any) => ({
        ...task,
        matchId: match.id,
        endDate: match.endDate,
        matchOpponent: match.challengerId === session.user!.id
          ? match.opponent.username
          : match.challenger.username
      }))
    )

    return NextResponse.json({ matchTasks: allTasks })
  } catch (error) {
    console.error('Active tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
