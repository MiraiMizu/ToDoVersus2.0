import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In Edge runtime, PRISMA doesn't support complex relation queries in the same way as Node.
    // We will do a generic feed of all users' activities for now (like a global feed) 
    // or just the user's past opponents + self to keep it simple and edge-compatible.

    // Import prism from main prisma file
    const { prisma } = await import('@/lib/prisma')
    const db = prisma

    // Find users who have had matches with the current user
    const matches = await db.match.findMany({
      where: {
        OR: [
          { challengerId: session.user.id },
          { opponentId: session.user.id }
        ]
      },
      select: { challengerId: true, opponentId: true }
    })

    const friendIds = new Set<string>()
    friendIds.add(session.user.id) // include self

    matches.forEach((m: { challengerId: string, opponentId: string }) => {
      friendIds.add(m.challengerId)
      friendIds.add(m.opponentId)
    })

    const feedUserIds = Array.from(friendIds)

    // Fetch recent 20 activities from these users
    const activities = await db.activityLog.findMany({
      where: {
        userId: { in: feedUserIds }
      },
      include: {
        category: true,
        user: { select: { id: true, username: true, allTimeScore: true } }
      },
      orderBy: {
        loggedAt: 'desc'
      },
      take: 20
    })

    return NextResponse.json({ feed: activities })
  } catch (error: any) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
