import { prisma } from './prisma'
import { getRank } from './ranks'

export async function updateStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
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

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastLogDate: new Date() },
  })

  return newStreak
}

export async function updateUserScore(userId: string, scoreToAdd: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const newAllTimeScore = user.allTimeScore + scoreToAdd
  const newRank = getRank(newAllTimeScore).name

  await prisma.user.update({
    where: { id: userId },
    data: { allTimeScore: newAllTimeScore, rank: newRank },
  })
}

export async function upsertDailyScore(
  userId: string,
  date: string,
  scoreToAdd: number,
  matchId?: string
): Promise<void> {
  const existing = await prisma.dailyScore.findFirst({
    where: { userId, date, matchId: matchId ?? null },
  })

  if (existing) {
    await prisma.dailyScore.update({
      where: { id: existing.id },
      data: { totalScore: existing.totalScore + scoreToAdd },
    })
  } else {
    await prisma.dailyScore.create({
      data: { userId, date, totalScore: scoreToAdd, matchId: matchId ?? null },
    })
  }
}
