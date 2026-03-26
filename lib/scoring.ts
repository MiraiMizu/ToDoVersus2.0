// Scoring formula: totalMinutes × categoryWeight
export function calculateScore(durationMinutes: number, categoryWeight: number): number {
  return durationMinutes * categoryWeight
}

export function formatScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
  return score.toString()
}

export function durationToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

export function minutesToDuration(totalMinutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}

export function formatDuration(totalMinutes: number): string {
  const { hours, minutes } = minutesToDuration(totalMinutes)
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

// Daily cap: 16 hours (960 minutes)
export const DAILY_CAP_MINUTES = 960
// Suspicious single-entry threshold: 8 hours (480 minutes)
export const SUSPICIOUS_ENTRY_MINUTES = 480
// Max same-name entries per day
export const MAX_SAME_NAME_PER_DAY = 5
