'use client'

import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Medal, LayoutDashboard } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RARITY_COLORS: Record<string, string> = {
  Common: 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40',
  Rare: 'border-blue-500/40 bg-blue-500/10',
  Epic: 'border-violet-500/40 bg-violet-500/10',
  Legendary: 'border-amber-500/40 bg-amber-500/10',
}

const RARITY_LABEL: Record<string, string> = {
  Common: 'text-slate-600 dark:text-slate-400',
  Rare: 'text-blue-600 dark:text-blue-400',
  Epic: 'text-violet-600 dark:text-violet-400',
  Legendary: 'text-amber-600 dark:text-amber-400',
}

export default function AchievementsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data: allAch } = useSWR('/api/achievements', fetcher)
  const { data: userData } = useSWR(userId ? `/api/users/${userId}` : null, fetcher)

  const achievements = allAch?.achievements ?? []
  const earnedCodes = new Set(
    (userData?.user?.achievements ?? []).map((ua: { achievement: { code: string } }) => ua.achievement?.code)
  )

  const earned = achievements.filter((a: { code: string }) => earnedCodes.has(a.code))
  const locked = achievements.filter((a: { code: string }) => !earnedCodes.has(a.code))

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fadeInUp">
      <div className="mb-6">
        <Link href="/dashboard" id="back-to-dashboard-achievements" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition mb-2">
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Medal className="w-6 h-6 text-violet-500 dark:text-violet-400" />
          Achievements
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {earned.length} / {achievements.length} unlocked
        </p>
      </div>

      {/* Progress bar */}
      <div className="glass rounded-2xl p-5 mb-6 border border-slate-200 dark:border-slate-800/60 shadow-sm">
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          <span>Progress</span>
          <span className="text-violet-600 dark:text-violet-400">{achievements.length > 0 ? Math.round((earned.length / achievements.length) * 100) : 0}%</span>
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)] relative"
            style={{ width: `${achievements.length > 0 ? (earned.length / achievements.length) * 100 : 0}%` }}
          >
            <div className="absolute inset-0 bg-white/20 dark:bg-white/10 w-full h-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-3">Unlocked</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {earned.map((a: { id: string; code: string; name: string; description: string; icon: string; rarity: string }) => (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 text-center transition hover:scale-105 hover:shadow-lg hover:shadow-violet-500/10 cursor-default ${RARITY_COLORS[a.rarity]}`}
              >
                <div className="text-4xl mb-2 drop-shadow-md">{a.icon}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{a.name}</div>
                <div className={`text-xs mt-1 font-bold tracking-wide uppercase ${RARITY_LABEL[a.rarity]}`}>{a.rarity}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-500 mt-2 leading-snug font-medium">{a.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-3 mt-8">Locked</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {locked.map((a: { id: string; name: string; description: string; icon: string; rarity: string }) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-center opacity-60 dark:opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-help"
              >
                <div className="text-4xl mb-2 opacity-80">{a.icon}</div>
                <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{a.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-600 mt-2 leading-snug font-medium">{a.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
