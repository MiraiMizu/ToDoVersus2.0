import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, username: true, avatarUrl: true, rank: true, streak: true } },
        opponent: { select: { id: true, username: true, avatarUrl: true, rank: true, streak: true } },
        bet: true,
        categories: { include: { category: true } },
        winner: { select: { id: true, username: true } },
        activityLogs: {
          include: { user: { select: { id: true, username: true } }, category: true },
          orderBy: { loggedAt: 'desc' },
        },
        dailyScores: {
          orderBy: { date: 'desc' },
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
