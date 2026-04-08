import { getDb } from '@/db'
import { users as userSchema, dailyScores as dsSchema } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getRank } from './ranks'

export async function updateStreak(userId: string): Promise<number> {
  const db = getDb()
  const user = await db.query.users.findFirst({ where: eq(userSchema.id, userId) })
  if (!user) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const lastLogStr = user.lastLogDate ? user.lastLogDate.toISOString().split('T')[0] : null

  let newStreak = user.streak

  if (lastLogStr === todayStr) {
    // Already logged today, no change
    return user.streak
  } else if (lastLogStr === yesterdayStr) {
    // Consecutive day — increment
    newStreak = user.streak + 1
  } else {
    // Streak broken or first log ever
    newStreak = 1
  }

  await db.update(userSchema).set({ streak: newStreak, lastLogDate: new Date().toISOString() }).where(eq(userSchema.id, userId))

  return newStreak
}

export async function updateUserScore(userId: string, scoreToAdd: number): Promise<void> {
  const db = getDb()
  const user = await db.query.users.findFirst({ where: eq(userSchema.id, userId) })
  if (!user) return

  const newAllTimeScore = user.allTimeScore + scoreToAdd
  const newRank = getRank(newAllTimeScore).name

  await db.update(userSchema).set({ allTimeScore: newAllTimeScore, rank: newRank }).where(eq(userSchema.id, userId))
}

export async function upsertDailyScore(
  userId: string,
  date: string,
  scoreToAdd: number,
  matchId?: string
): Promise<void> {
  const db = getDb()
  const matchIdCond = matchId ? eq(dsSchema.matchId, matchId) : isNull(dsSchema.matchId)
  const existing = await db.query.dailyScores.findFirst({
    where: and(eq(dsSchema.userId, userId), eq(dsSchema.date, date), matchIdCond)
  })

  if (existing) {
    await db.update(dsSchema).set({ totalScore: existing.totalScore + scoreToAdd }).where(eq(dsSchema.id, existing.id))
  } else {
    await db.insert(dsSchema).values({ userId, date, totalScore: scoreToAdd, matchId: matchId ?? null })
  }
}
