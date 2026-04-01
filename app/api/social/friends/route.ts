import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Find all matches the user is involved in
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { opponentId: userId }
        ]
      },
      include: {
        challenger: {
          select: { id: true, username: true, rank: true, streak: true, allTimeScore: true }
        },
        opponent: {
          select: { id: true, username: true, rank: true, streak: true, allTimeScore: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const todayDateStr = new Date().toISOString().split('T')[0]

    // We only need the opponent friends, not ourselves
    const friendsMap = new Map()

    for (const match of matches) {
      const isChallenger = match.challengerId === userId
      const friend = isChallenger ? match.opponent : match.challenger

      // If we already added this friend and the current iterated match is older, 
      // we only want to keep the most recent match data for status purposes.
      if (!friendsMap.has(friend.id)) {
        friendsMap.set(friend.id, {
          user: friend,
          matchId: match.id,
          matchStatus: match.status, // "PENDING", "ACTIVE", "COMPLETED", "REJECTED"
          todayScore: 0 // Will fetch later if ACTIVE
        })
      }
    }

    const friendsList = Array.from(friendsMap.values())

    // Fetch today's scores for friends in ACTIVE matches
    for (const friendRecord of friendsList) {
      if (friendRecord.matchStatus === 'ACTIVE') {
        const dailyScore = await prisma.dailyScore.findFirst({
          where: {
            userId: friendRecord.user.id,
            matchId: friendRecord.matchId,
            date: todayDateStr
          }
        })
        friendRecord.todayScore = dailyScore?.totalScore || 0
      }
    }

    return NextResponse.json({ friends: friendsList })
  } catch (error) {
    console.error('Social API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
