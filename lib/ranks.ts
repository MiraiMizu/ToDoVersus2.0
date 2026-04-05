export type Rank = {
  name: string
  minScore: number
  maxScore: number
  color: string
  gradient: string
  icon: string
}

export const RANKS: Rank[] = [
  { name: 'Bronze', minScore: 0, maxScore: 999, color: '#cd7f32', gradient: 'from-amber-700 to-amber-500', icon: '🥉' },
  { name: 'Silver', minScore: 1000, maxScore: 4999, color: '#9ca3af', gradient: 'from-gray-400 to-gray-300', icon: '🥈' },
  { name: 'Gold', minScore: 5000, maxScore: 14999, color: '#f59e0b', gradient: 'from-yellow-500 to-yellow-300', icon: '🥇' },
  { name: 'Platinum', minScore: 15000, maxScore: Infinity, color: '#6366f1', gradient: 'from-violet-500 to-indigo-400', icon: '💎' },
]

export function getRank(allTimeScore: number): Rank {
  return RANKS.find((r) => allTimeScore >= r.minScore && allTimeScore <= r.maxScore) ?? RANKS[0]
}

export function getNextRank(allTimeScore: number): Rank | null {
  const currentRankIndex = RANKS.findIndex((r) => allTimeScore >= r.minScore && allTimeScore <= r.maxScore)
  if (currentRankIndex === RANKS.length - 1) return null
  return RANKS[currentRankIndex + 1]
}

export function getRankProgress(allTimeScore: number): number {
  const rank = getRank(allTimeScore)
  if (rank.maxScore === Infinity) return 100
  const progress = ((allTimeScore - rank.minScore) / (rank.maxScore - rank.minScore + 1)) * 100
  return Math.min(Math.round(progress), 100)
}

export function getLevel(allTimeScore: number): number {
  // Level 1 starts at 0 score. Every 10 points = 1 more level.
  return 1 + Math.floor(allTimeScore / 10)
}

export function getXPLabel(allTimeScore: number): string {
  const level = getLevel(allTimeScore)
  const currentLevelScore = (level - 1) * 10
  const xpIntoLevel = allTimeScore - currentLevelScore
  return `${xpIntoLevel}/10 XP`
}
