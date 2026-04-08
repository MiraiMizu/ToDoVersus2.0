export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { dailyScores as dsSchema, users, matches } from '@/db/schema'
import { eq, isNull, desc, gte, sql, count } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'alltime' // daily | monthly | alltime | match
    const matchId = searchParams.get('matchId')

    const db = getDb()

    if (period === 'match' && matchId) {
      // Match leaderboard: aggregate daily scores for this match
      const scores = await db.select({
        userId: dsSchema.userId,
        _sum: { totalScore: sql<number>`sum(${dsSchema.totalScore})`.mapWith(Number) }
      }).from(dsSchema)
        .where(eq(dsSchema.matchId, matchId))
        .groupBy(dsSchema.userId)
        .orderBy(desc(sql`sum(${dsSchema.totalScore})`))

      const usersWithScores = await Promise.all(
        scores.map(async (s: any) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, s.userId),
            columns: { id: true, username: true, avatarUrl: true, rank: true },
          })
          return { user, totalScore: s._sum.totalScore ?? 0 }
        })
      )

      return NextResponse.json({ leaderboard: usersWithScores })
    }

    if (period === 'daily') {
      const today = new Date().toISOString().split('T')[0]
      const scores = await db.select({
        userId: dsSchema.userId,
        _sum: { totalScore: sql<number>`sum(${dsSchema.totalScore})`.mapWith(Number) }
      }).from(dsSchema)
        .where(sql`${dsSchema.date} = ${today} AND ${dsSchema.matchId} IS NULL`)
        .groupBy(dsSchema.userId)
        .orderBy(desc(sql`sum(${dsSchema.totalScore})`))
        .limit(50)

      const leaderboard = await Promise.all(
        scores.map(async (s: any) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, s.userId),
            columns: { id: true, username: true, avatarUrl: true, rank: true },
          })
          return { user, totalScore: s._sum.totalScore ?? 0 }
        })
      )

      return NextResponse.json({ leaderboard })
    }

    if (period === 'monthly') {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const scores = await db.select({
        userId: dsSchema.userId,
        _sum: { totalScore: sql<number>`sum(${dsSchema.totalScore})`.mapWith(Number) }
      }).from(dsSchema)
        .where(sql`${dsSchema.date} >= ${monthStart} AND ${dsSchema.matchId} IS NULL`)
        .groupBy(dsSchema.userId)
        .orderBy(desc(sql`sum(${dsSchema.totalScore})`))
        .limit(50)

      const leaderboard = await Promise.all(
        scores.map(async (s: any) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, s.userId),
            columns: { id: true, username: true, avatarUrl: true, rank: true },
          })
          return { user, totalScore: s._sum.totalScore ?? 0 }
        })
      )

      return NextResponse.json({ leaderboard })
    }

    // All-time leaderboard
    const usersList = await db.select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      rank: users.rank,
      allTimeScore: users.allTimeScore,
      streak: users.streak,
      wonMatches: sql<number>`(SELECT COUNT(*) FROM Match WHERE Match.winnerId = User.id)`.mapWith(Number)
    }).from(users)
      .orderBy(desc(users.allTimeScore))
      .limit(50)

    const leaderboard = usersList.map((u: any) => ({
      user: { id: u.id, username: u.username, avatarUrl: u.avatarUrl, rank: u.rank },
      totalScore: u.allTimeScore,
      streak: u.streak,
      wins: u.wonMatches,
    }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
