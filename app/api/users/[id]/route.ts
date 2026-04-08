export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users as usersSchema, matches, activityLogs as activityLogsSchema } from '@/db/schema'
import { eq, sql, count } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const rawUser = await db.query.users.findFirst({
      where: eq(usersSchema.id, id),
      columns: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        rank: true,
        streak: true,
        allTimeScore: true,
        createdAt: true,
        motto: true,
      },
      with: {
        achievements: {
          with: { achievement: true },
          orderBy: (a: any, { desc }: any) => [desc(a.awardedAt)],
        },
        activityLogs: {
          limit: 10,
          orderBy: (al: any, { desc }: any) => [desc(al.loggedAt)],
          with: { category: true },
        },
      },
    })

    if (!rawUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const challengedMatchesCount = await db.select({ count: count() }).from(matches).where(eq(matches.challengerId, id))
    const opponentMatchesCount = await db.select({ count: count() }).from(matches).where(eq(matches.opponentId, id))
    const wonMatchesCount = await db.select({ count: count() }).from(matches).where(eq(matches.winnerId, id))

    const user = {
      ...rawUser,
      _count: {
        challengedMatches: challengedMatchesCount[0].count,
        opponentMatches: opponentMatchesCount[0].count,
        wonMatches: wonMatchesCount[0].count,
      }
    }

    const totalMinutesData = await db.select({ sum: sql<number>`sum(${activityLogsSchema.durationMinutes})`.mapWith(Number) })
      .from(activityLogsSchema).where(eq(activityLogsSchema.userId, id))

    return NextResponse.json({ 
      user: {
        ...user,
        totalMinutesLogged: totalMinutesData[0].sum || 0
      } 
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, avatarUrl } = body

    const db = getDb()
    const result = await db.update(usersSchema).set({ username, avatarUrl }).where(eq(usersSchema.id, id)).returning({
      id: usersSchema.id,
      username: usersSchema.username,
      avatarUrl: usersSchema.avatarUrl,
      rank: usersSchema.rank,
    })
    const user = result[0]

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
