export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { activityLogs as acSchema, suspiciousLogs as susSchema, categories as catSchema, users as userSchema, matches } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
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

    const db = getDb()
    let conditions = [eq(acSchema.userId, userId)]
    if (matchId) conditions.push(eq(acSchema.matchId, matchId))
    if (date) conditions.push(eq(acSchema.date, date))

    const activities = await db.query.activityLogs.findMany({
      where: and(...conditions),
      with: {
        category: true,
        user: { columns: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: (logs: any, { desc }: any) => [desc(logs.loggedAt)]
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
    const { name, categoryId, hours, minutes, matchId, matchTaskId } = body

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
    const db = getDb()
    const todayLogs = await db.query.activityLogs.findMany({
      where: and(eq(acSchema.userId, userId), eq(acSchema.date, today)),
      columns: { durationMinutes: true, name: true },
    })

    const existingMinutes = todayLogs.reduce((sum: number, log: { durationMinutes: number }) => sum + log.durationMinutes, 0)
    if (existingMinutes + totalMinutes > DAILY_CAP_MINUTES) {
      return NextResponse.json({
        error: `Daily limit reached. You can only log ${DAILY_CAP_MINUTES - existingMinutes} more minutes today (${Math.floor((DAILY_CAP_MINUTES - existingMinutes) / 60)}h ${(DAILY_CAP_MINUTES - existingMinutes) % 60}m).`,
      }, { status: 400 })
    }

    // Anti-cheat: flag suspicious single entries
    if (totalMinutes > SUSPICIOUS_ENTRY_MINUTES) {
      await db.insert(susSchema).values({
        userId, reason: 'Large single entry', metadata: JSON.stringify({ name, totalMinutes, date: today }),
      })
    }

    // Anti-cheat: check same-name entries count
    const sameNameCount = todayLogs.filter((l: { name: string }) => l.name.toLowerCase() === name.toLowerCase()).length
    if (sameNameCount >= MAX_SAME_NAME_PER_DAY) {
      await db.insert(susSchema).values({
        userId, reason: 'Repeated activity name', metadata: JSON.stringify({ name, count: sameNameCount + 1 }),
      })
    }

    // Get category for weight
    const category = await db.query.categories.findFirst({ where: eq(catSchema.id, categoryId) })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const score = calculateScore(totalMinutes, category.weight)
    const now = new Date()
    const hour = now.getHours()

    const insertResult = await db.insert(acSchema).values({
      userId,
      matchId: matchId || null,
      matchTaskId: matchTaskId || null,
      categoryId,
      name,
      durationMinutes: totalMinutes,
      score,
      date: today,
    }).returning()
    
    const activity = await db.query.activityLogs.findFirst({
      where: eq(acSchema.id, insertResult[0].id),
      with: { category: true }
    })

    // Update streaks and scores
    const newStreak = await updateStreak(userId)
    await updateUserScore(userId, score)
    await upsertDailyScore(userId, today, score, matchId || undefined)

    // Get updated user for achievement checks
    const user = await db.query.users.findFirst({ where: eq(userSchema.id, userId) })
    const matchWinsResult = await db.select({ count: count() }).from(matches).where(eq(matches.winnerId, userId))
    const matchWins = matchWinsResult[0].count

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
