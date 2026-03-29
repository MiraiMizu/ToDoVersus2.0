import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'alltime' // daily | monthly | alltime | match
    const matchId = searchParams.get('matchId')

    if (period === 'match' && matchId) {
      // Match leaderboard: aggregate daily scores for this match
      const scores = await prisma.dailyScore.groupBy({
        by: ['userId'],
        where: { matchId },
        _sum: { totalScore: true },
        orderBy: { _sum: { totalScore: 'desc' } },
      })

      const usersWithScores = await Promise.all(
        scores.map(async (s: { userId: string; _sum: { totalScore: number | null } }) => {
          const user = await prisma.user.findUnique({
            where: { id: s.userId },
            select: { id: true, username: true, avatarUrl: true, rank: true },
          })
          return { user, totalScore: s._sum.totalScore ?? 0 }
        })
      )

      return NextResponse.json({ leaderboard: usersWithScores })
    }

    if (period === 'daily') {
      const today = new Date().toISOString().split('T')[0]
      const scores = await prisma.dailyScore.groupBy({
        by: ['userId'],
        where: { date: today, matchId: null },
        _sum: { totalScore: true },
        orderBy: { _sum: { totalScore: 'desc' } },
        take: 50,
      })

      const leaderboard = await Promise.all(
        scores.map(async (s: { userId: string; _sum: { totalScore: number | null } }) => {
          const user = await prisma.user.findUnique({
            where: { id: s.userId },
            select: { id: true, username: true, avatarUrl: true, rank: true },
          })
          return { user, totalScore: s._sum.totalScore ?? 0 }
        })
      )

      return NextResponse.json({ leaderboard })
    }

    if (period === 'monthly') {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const scores = await prisma.dailyScore.groupBy({
        by: ['userId'],
        where: { date: { gte: monthStart }, matchId: null },
        _sum: { totalScore: true },
        orderBy: { _sum: { totalScore: 'desc' } },
        take: 50,
      })

      const leaderboard = await Promise.all(
        scores.map(async (s: { userId: string; _sum: { totalScore: number | null } }) => {
          const user = await prisma.user.findUnique({
            where: { id: s.userId },
            select: { id: true, username: true, avatarUrl: true, rank: true },
          })
          return { user, totalScore: s._sum.totalScore ?? 0 }
        })
      )

      return NextResponse.json({ leaderboard })
    }

    // All-time leaderboard
    const users = await prisma.user.findMany({
      orderBy: { allTimeScore: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        rank: true,
        allTimeScore: true,
        streak: true,
        _count: { select: { wonMatches: true } },
      },
    })

    const leaderboard = users.map((u: any) => ({
      user: { id: u.id, username: u.username, avatarUrl: u.avatarUrl, rank: u.rank },
      totalScore: u.allTimeScore,
      streak: u.streak,
      wins: u._count.wonMatches,
    }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
