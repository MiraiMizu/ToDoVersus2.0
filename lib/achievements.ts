import { prisma } from './prisma'

export type AchievementCheckContext = {
  userId: string
  score?: number
  date?: string
  hour?: number
  matchWins?: number
  categoriesLoggedToday?: string[]
  allTimeScore?: number
  streak?: number
}

const ACHIEVEMENT_CHECKS: {
  code: string
  check: (ctx: AchievementCheckContext) => Promise<boolean>
}[] = [
  {
    code: 'FIRST_LOG',
    check: async (ctx) => {
      const count = await prisma.activityLog.count({ where: { userId: ctx.userId } })
      return count >= 1
    },
  },
  {
    code: 'STREAK_3',
    check: async (ctx) => (ctx.streak ?? 0) >= 3,
  },
  {
    code: 'STREAK_7',
    check: async (ctx) => (ctx.streak ?? 0) >= 7,
  },
  {
    code: 'STREAK_30',
    check: async (ctx) => (ctx.streak ?? 0) >= 30,
  },
  {
    code: 'SCORE_1000',
    check: async (ctx) => (ctx.score ?? 0) >= 1000,
  },
  {
    code: 'SCORE_5000',
    check: async (ctx) => (ctx.allTimeScore ?? 0) >= 5000,
  },
  {
    code: 'SCORE_10000',
    check: async (ctx) => (ctx.allTimeScore ?? 0) >= 10000,
  },
  {
    code: 'MATCH_WIN',
    check: async (ctx) => (ctx.matchWins ?? 0) >= 1,
  },
  {
    code: 'MATCH_WIN_3',
    check: async (ctx) => (ctx.matchWins ?? 0) >= 3,
  },
  {
    code: 'MATCH_WIN_10',
    check: async (ctx) => (ctx.matchWins ?? 0) >= 10,
  },
  {
    code: 'FIRST_MATCH',
    check: async (ctx) => {
      const count = await prisma.match.count({
        where: { OR: [{ challengerId: ctx.userId }, { opponentId: ctx.userId }] },
      })
      return count >= 1
    },
  },
  {
    code: 'EARLY_BIRD',
    check: async (ctx) => (ctx.hour ?? 12) < 8,
  },
  {
    code: 'NIGHT_OWL',
    check: async (ctx) => (ctx.hour ?? 0) >= 22,
  },
  {
    code: 'ALL_CATEGORIES',
    check: async (ctx) => {
      if (!ctx.date) return false
      const logs = await prisma.activityLog.findMany({
        where: { userId: ctx.userId, date: ctx.date },
        include: { category: true },
      })
      const weights = new Set(logs.map((l) => l.category.weight))
      return weights.has(1) && weights.has(2) && weights.has(4)
    },
  },
  {
    code: 'GOLD_RANK',
    check: async (ctx) => (ctx.allTimeScore ?? 0) >= 5000,
  },
]

export async function checkAndAwardAchievements(ctx: AchievementCheckContext): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    include: { achievements: { include: { achievement: true } } },
  })
  if (!user) return []

  const existingCodes = new Set(user.achievements.map((ua) => ua.achievement.code))
  const newlyAwarded: string[] = []

  for (const { code, check } of ACHIEVEMENT_CHECKS) {
    if (existingCodes.has(code)) continue
    try {
      const qualified = await check(ctx)
      if (qualified) {
        const achievement = await prisma.achievement.findUnique({ where: { code } })
        if (achievement) {
          await prisma.userAchievement.create({
            data: { userId: ctx.userId, achievementId: achievement.id },
          })
          newlyAwarded.push(code)
        }
      }
    } catch {
      // silently skip if check fails
    }
  }

  return newlyAwarded
}
