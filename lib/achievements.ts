import { prisma } from './prisma'

export type AchievementCheckContext = {
  userId: string
  score?: number
  date?: string
  hour?: number
  matchWins?: number
  allTimeScore?: number
  streak?: number
  // Pre-fetched optional data to avoid multiple DB queries in checks
  totalActivitiesCount?: number
  totalMatchesCount?: number
  categoryWeightsToday?: Set<number>
}

const ACHIEVEMENT_CHECKS: {
  code: string
  check: (ctx: AchievementCheckContext) => boolean | Promise<boolean>
}[] = [
  {
    code: 'FIRST_LOG',
    check: (ctx) => (ctx.totalActivitiesCount ?? 0) >= 1,
  },
  {
    code: 'STREAK_3',
    check: (ctx) => (ctx.streak ?? 0) >= 3,
  },
  {
    code: 'STREAK_7',
    check: (ctx) => (ctx.streak ?? 0) >= 7,
  },
  {
    code: 'STREAK_30',
    check: (ctx) => (ctx.streak ?? 0) >= 30,
  },
  {
    code: 'SCORE_1000',
    check: (ctx) => (ctx.score ?? 0) >= 1000,
  },
  {
    code: 'SCORE_5000',
    check: (ctx) => (ctx.allTimeScore ?? 0) >= 5000,
  },
  {
    code: 'SCORE_10000',
    check: (ctx) => (ctx.allTimeScore ?? 0) >= 10000,
  },
  {
    code: 'MATCH_WIN',
    check: (ctx) => (ctx.matchWins ?? 0) >= 1,
  },
  {
    code: 'MATCH_WIN_3',
    check: (ctx) => (ctx.matchWins ?? 0) >= 3,
  },
  {
    code: 'MATCH_WIN_10',
    check: (ctx) => (ctx.matchWins ?? 0) >= 10,
  },
  {
    code: 'FIRST_MATCH',
    check: (ctx) => (ctx.totalMatchesCount ?? 0) >= 1,
  },
  {
    code: 'EARLY_BIRD',
    check: (ctx) => (ctx.hour ?? 12) < 8,
  },
  {
    code: 'NIGHT_OWL',
    check: (ctx) => (ctx.hour ?? 0) >= 22,
  },
  {
    code: 'ALL_CATEGORIES',
    check: (ctx) => {
      const weights = ctx.categoryWeightsToday
      if (!weights) return false
      return weights.has(1) && weights.has(2) && weights.has(4)
    },
  },
  {
    code: 'GOLD_RANK',
    check: (ctx) => (ctx.allTimeScore ?? 0) >= 5000,
  },
]

export async function checkAndAwardAchievements(ctx: AchievementCheckContext): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    include: { achievements: { include: { achievement: true } } },
  })
  if (!user) return []

  const existingCodes = new Set(user.achievements.map((ua) => ua.achievement.code))
  
  // Pre-fetch all necessary data once to avoid queries inside the loop
  const totalActivitiesCount = await prisma.activityLog.count({ where: { userId: ctx.userId } })
  const totalMatchesCount = await prisma.match.count({
    where: { OR: [{ challengerId: ctx.userId }, { opponentId: ctx.userId }] },
  })
  
  let categoryWeightsToday: Set<number> | undefined
  if (ctx.date) {
    const logs = await prisma.activityLog.findMany({
      where: { userId: ctx.userId, date: ctx.date },
      include: { category: true },
    })
    categoryWeightsToday = new Set(logs.map((l) => l.category.weight))
  }

  const enrichedCtx: AchievementCheckContext = {
    ...ctx,
    totalActivitiesCount,
    totalMatchesCount,
    categoryWeightsToday,
  }

  // Fetch all achievements from the database once
  const allAchievements = await prisma.achievement.findMany()
  const achievementMap = new Map(allAchievements.map(a => [a.code, a]))

  const newlyAwarded: string[] = []

  for (const { code, check } of ACHIEVEMENT_CHECKS) {
    if (existingCodes.has(code)) continue
    try {
      const qualified = await check(enrichedCtx)
      if (qualified) {
        const achievement = achievementMap.get(code)
        if (achievement) {
          await prisma.userAchievement.create({
            data: { userId: ctx.userId, achievementId: achievement.id },
          })
          newlyAwarded.push(code)
        }
      }
    } catch (err) {
      console.error(`Error checking achievement ${code}:`, err)
    }
  }

  return newlyAwarded
}
