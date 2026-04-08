export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matches, bets, matchTasks as matchTasksSchema } from '@/db/schema'
import { eq, or, desc } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const matchesList = await db.query.matches.findMany({
      where: or(
        eq(matches.challengerId, session.user.id),
        eq(matches.opponentId, session.user.id)
      ),
      with: {
        challenger: { columns: { id: true, username: true, avatarUrl: true, rank: true } },
        opponent: { columns: { id: true, username: true, avatarUrl: true, rank: true } },
        bet: true,
        categories: { with: { category: true } },
        matchTasks: { with: { category: true } },
        winner: { columns: { id: true, username: true } },
      },
      orderBy: (matches: any, { desc }: any) => [desc(matches.createdAt)],
    })

    return NextResponse.json({ matches: matchesList })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opponentId, matchTasks, betContent, durationHours = 24 } = body

    if (!opponentId || !matchTasks || matchTasks.length === 0) {
      return NextResponse.json({ error: 'Opponent and tasks are required' }, { status: 400 })
    }

    if (matchTasks.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 tasks allowed' }, { status: 400 })
    }

    for (const mt of matchTasks) {
       if (!mt.content || !mt.categoryId) return NextResponse.json({ error: 'All tasks must have content and category assigned' }, { status: 400 })
    }

    if (opponentId === session.user.id) {
      return NextResponse.json({ error: 'You cannot challenge yourself' }, { status: 400 })
    }

    // Duration can be custom or 'Forever' (represented by a very large number like 10 years)
    const duration = Math.min(Math.max(Number(durationHours) || 24, 1), 87600) // 1h to 10 years (87600h)

    const db = getDb()
    const result = await db.insert(matches).values({
      challengerId: session.user.id,
      opponentId,
      status: 'PENDING',
      durationHours: duration,
    }).returning()
    const matchBase = result[0]
    
    for (const t of matchTasks) {
      await db.insert(matchTasksSchema).values({
        matchId: matchBase.id,
        content: t.content,
        categoryId: t.categoryId,
        userId: session.user.id
      })
    }
    
    if (betContent) {
      await db.insert(bets).values({
        matchId: matchBase.id,
        content: betContent,
        challengerApproved: true
      })
    }
    
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchBase.id),
      with: {
        challenger: { columns: { id: true, username: true, avatarUrl: true } },
        opponent: { columns: { id: true, username: true, avatarUrl: true } },
        matchTasks: { with: { category: true } },
        bet: true,
      },
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error('Create match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
