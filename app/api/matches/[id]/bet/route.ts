export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matches, bets } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content } = body

    const db = getDb()
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
      with: { bet: true },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isChallenger = match.challengerId === session.user.id
    const isOpponent = match.opponentId === session.user.id

    if (!isChallenger && !isOpponent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (match.bet) {
      // Approve existing bet
      const updateData = isChallenger
        ? { challengerApproved: true }
        : { opponentApproved: true }

      const result = await db.update(bets).set(updateData).where(eq(bets.matchId, id)).returning()
      const bet = result[0]

      return NextResponse.json({ bet })
    }

    // Create new bet
    const res = await db.insert(bets).values({
      matchId: id,
      content: content || '',
      challengerApproved: isChallenger,
      opponentApproved: isOpponent,
    }).returning()
    const bet = res[0]

    return NextResponse.json({ bet })
  } catch (error) {
    console.error('Bet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
