import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { calculateScore, DAILY_CAP_MINUTES, SUSPICIOUS_ENTRY_MINUTES, MAX_SAME_NAME_PER_DAY } from '@/lib/scoring'
import { updateStreak, updateUserScore, upsertDailyScore } from '@/lib/streaks'
import { checkAndAwardAchievements } from '@/lib/achievements'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const userId = searchParams.get('userId') || session.user.id
    const date = searchParams.get('date')

    const where: Record<string, unknown> = { userId }
    if (matchId) where.matchId = matchId
    if (date) where.date = date

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        category: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { loggedAt: 'desc' },
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Get activities error:', error)
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
    const { name, categoryId, hours, minutes, matchId } = body

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Activity name and category are required' }, { status: 400 })
    }

    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0)

    if (totalMinutes <= 0) {
      return NextResponse.json({ error: 'Duration must be greater than 0' }, { status: 400 })
    }

    if (totalMinutes > 1440) {
      return NextResponse.json({ error: 'Duration cannot exceed 24 hours (1440 minutes)' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const userId = session.user.id

    // Anti-cheat: check daily cap
    const todayLogs = await prisma.activityLog.findMany({
      where: { userId, date: today },
      select: { durationMinutes: true, name: true },
    })

    const existingMinutes = todayLogs.reduce((sum, log) => sum + log.durationMinutes, 0)
    if (existingMinutes + totalMinutes > DAILY_CAP_MINUTES) {
      return NextResponse.json({
        error: `Daily limit reached. You can only log ${DAILY_CAP_MINUTES - existingMinutes} more minutes today (${Math.floor((DAILY_CAP_MINUTES - existingMinutes) / 60)}h ${(DAILY_CAP_MINUTES - existingMinutes) % 60}m).`,
      }, { status: 400 })
    }

    // Anti-cheat: flag suspicious single entries
    if (totalMinutes > SUSPICIOUS_ENTRY_MINUTES) {
      await prisma.suspiciousLog.create({
        data: { userId, reason: 'Large single entry', metadata: JSON.stringify({ name, totalMinutes, date: today }) },
      })
    }

    // Anti-cheat: check same-name entries count
    const sameNameCount = todayLogs.filter((l) => l.name.toLowerCase() === name.toLowerCase()).length
    if (sameNameCount >= MAX_SAME_NAME_PER_DAY) {
      await prisma.suspiciousLog.create({
        data: { userId, reason: 'Repeated activity name', metadata: JSON.stringify({ name, count: sameNameCount + 1 }) },
      })
    }

    // Get category for weight
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const score = calculateScore(totalMinutes, category.weight)
    const now = new Date()
    const hour = now.getHours()

    const activity = await prisma.activityLog.create({
      data: {
        userId,
        matchId: matchId || null,
        categoryId,
        name,
        durationMinutes: totalMinutes,
        score,
        date: today,
      },
      include: { category: true },
    })

    // Update streaks and scores
    const newStreak = await updateStreak(userId)
    await updateUserScore(userId, score)
    await upsertDailyScore(userId, today, score, matchId || undefined)

    // Get updated user for achievement checks
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const matchWins = await prisma.match.count({ where: { winnerId: userId } })

    const newAchievements = await checkAndAwardAchievements({
      userId,
      score,
      date: today,
      hour,
      matchWins,
      allTimeScore: user?.allTimeScore ?? 0,
      streak: newStreak,
    })

    return NextResponse.json({ activity, score, newAchievements, streak: newStreak }, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
