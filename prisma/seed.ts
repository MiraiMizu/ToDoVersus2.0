import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const dbFile = process.env.DATABASE_URL?.replace('file:', '') ?? './dev.db'
const url = path.resolve(process.cwd(), dbFile)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaBetterSqlite3({ url } as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)



async function main() {
  console.log('Seeding database...')

  // Seed categories
  const important = await prisma.category.upsert({
    where: { name: 'Important' },
    update: {},
    create: { name: 'Important', weight: 4, description: 'High-priority work and deep focus tasks', color: '#6366f1' },
  })

  const lessImportant = await prisma.category.upsert({
    where: { name: 'Less Important' },
    update: {},
    create: { name: 'Less Important', weight: 2, description: 'Moderate priority tasks and side projects', color: '#f59e0b' },
  })

  const relaxing = await prisma.category.upsert({
    where: { name: 'For Relaxing' },
    update: {},
    create: { name: 'For Relaxing', weight: 1, description: 'Rest, hobbies, and light activities', color: '#10b981' },
  })

  console.log('✓ Categories seeded:', important.name, lessImportant.name, relaxing.name)

  // Seed achievements
  const achievements = [
    { code: 'FIRST_LOG', name: 'First Step', description: 'Log your very first activity', icon: '🚀', rarity: 'Common' },
    { code: 'STREAK_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥', rarity: 'Common' },
    { code: 'STREAK_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡', rarity: 'Rare' },
    { code: 'STREAK_30', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '💎', rarity: 'Legendary' },
    { code: 'SCORE_1000', name: 'Points Hunter', description: 'Earn 1,000 points in a single day', icon: '💯', rarity: 'Rare' },
    { code: 'SCORE_5000', name: 'Score Machine', description: 'Earn 5,000 total points', icon: '🎯', rarity: 'Rare' },
    { code: 'SCORE_10000', name: 'Elite Scorer', description: 'Earn 10,000 total points', icon: '👑', rarity: 'Epic' },
    { code: 'MATCH_WIN', name: 'Victor', description: 'Win your first match', icon: '🏆', rarity: 'Rare' },
    { code: 'MATCH_WIN_3', name: 'Champion', description: 'Win 3 matches', icon: '🥇', rarity: 'Epic' },
    { code: 'MATCH_WIN_10', name: 'Legend', description: 'Win 10 matches', icon: '🌟', rarity: 'Legendary' },
    { code: 'FIRST_MATCH', name: 'Challenger', description: 'Create your first match', icon: '⚔️', rarity: 'Common' },
    { code: 'EARLY_BIRD', name: 'Early Bird', description: 'Log an activity before 8 AM', icon: '🌅', rarity: 'Rare' },
    { code: 'NIGHT_OWL', name: 'Night Owl', description: 'Log an activity after 10 PM', icon: '🦉', rarity: 'Rare' },
    { code: 'ALL_CATEGORIES', name: 'Balanced', description: 'Log activities in all 3 categories in one day', icon: '⚖️', rarity: 'Epic' },
    { code: 'GOLD_RANK', name: 'Gold Achiever', description: 'Reach Gold rank', icon: '🥇', rarity: 'Epic' },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach,
    })
  }

  console.log('✓ Achievements seeded:', achievements.length)
  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
