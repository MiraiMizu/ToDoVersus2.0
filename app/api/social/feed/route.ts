export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/db'
import { matches as matchesSchema, activityLogs } from '@/db/schema'
import { eq, or, inArray } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In Edge runtime, PRISMA doesn't support complex relation queries in the same way as Node.
    // We will do a generic feed of all users' activities for now (like a global feed) 
    // or just the user's past opponents + self to keep it simple and edge-compatible.

    const db = getDb()

    // Find users who have had matches with the current user
    const matches = await db.query.matches.findMany({
      where: or(
        eq(matchesSchema.challengerId, session.user.id),
        eq(matchesSchema.opponentId, session.user.id)
      ),
      columns: { challengerId: true, opponentId: true }
    })

    const friendIds = new Set<string>()
    friendIds.add(session.user.id) // include self

    matches.forEach((m: { challengerId: string, opponentId: string }) => {
      friendIds.add(m.challengerId)
      friendIds.add(m.opponentId)
    })

    const feedUserIds = Array.from(friendIds)

    // Fetch recent 20 activities from these users
    const activities = await db.query.activityLogs.findMany({
      where: inArray(activityLogs.userId, feedUserIds),
      with: {
        category: true,
        user: { columns: { id: true, username: true, allTimeScore: true } },
        reactions: true
      },
      orderBy: (logs: any, { desc }: any) => [desc(logs.loggedAt)],
      limit: 20
    })

    return NextResponse.json({ feed: activities })
  } catch (error: any) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}
