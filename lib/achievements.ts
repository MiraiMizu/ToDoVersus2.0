import { getDb } from '@/db'
import { users as userSchema, activityLogs, matches, achievements as achSchema, userAchievements, categories } from '@/db/schema'
import { eq, or, and, count, inArray } from 'drizzle-orm'

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
  const db = getDb()
  const user = await db.query.users.findFirst({
    where: eq(userSchema.id, ctx.userId),
    with: { achievements: { with: { achievement: true } } },
  })
  if (!user) return []

  const existingCodes = new Set(user.achievements.map((ua: any) => ua.achievement.code))
  
  // Pre-fetch all necessary data once to avoid queries inside the loop
  const logsCountArray = await db.select({ count: count() }).from(activityLogs).where(eq(activityLogs.userId, ctx.userId))
  const totalActivitiesCount = logsCountArray[0].count
  
  const matchesCountArray = await db.select({ count: count() }).from(matches).where(
    or(eq(matches.challengerId, ctx.userId), eq(matches.opponentId, ctx.userId))
  )
  const totalMatchesCount = matchesCountArray[0].count

  let categoryWeightsToday: Set<number> | undefined
  if (ctx.date) {
    const logs = await db.query.activityLogs.findMany({
      where: and(eq(activityLogs.userId, ctx.userId), eq(activityLogs.date, ctx.date)),
      with: { category: true }
    })
    categoryWeightsToday = new Set(logs.map((l: any) => l.category.weight))
  }

  const enrichedCtx: AchievementCheckContext = {
    ...ctx,
    totalActivitiesCount,
    totalMatchesCount,
    categoryWeightsToday,
  }

  // Fetch all achievements from the database once
  const allAchievements = await db.select().from(achSchema)
  const achievementMap = new Map(allAchievements.map((a: any) => [a.code, a]))

  const newlyAwarded: string[] = []

  for (const { code, check } of ACHIEVEMENT_CHECKS) {
    if (existingCodes.has(code)) continue
    try {
      const qualified = await check(enrichedCtx)
      if (qualified) {
        const achievement: any = achievementMap.get(code)
        if (achievement) {
          await db.insert(userAchievements).values({
            userId: ctx.userId, achievementId: achievement.id
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
