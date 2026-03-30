'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatScore } from '@/lib/scoring'
import { Trophy, Crown, Flame, LayoutDashboard } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PERIODS = [
  { key: 'daily', label: 'Today' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All-Time' },
]

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fadeInUp">
      <div className="mb-6">
        <Link href="/dashboard" id="back-to-dashboard-leaderboard" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition mb-2">
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">See how you rank against everyone</p>
      </div>

      <div className="space-y-6">
        {PERIODS.map((p) => (
          <LeaderboardSection key={p.key} period={p.key} label={p.label} currentUserId={userId} />
        ))}
      </div>
    </div>
  )
}

function LeaderboardSection({
  period,
  label,
  currentUserId,
}: {
  period: string
  label: string
  currentUserId?: string
}) {
  const { data, isLoading } = useSWR(`/api/scores/leaderboard?period=${period}`, fetcher, {
    refreshInterval: 60000,
  })
  const list = data?.leaderboard ?? []

  return (
    <div className="glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-transparent">
        <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{label}</h2>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading...</div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">No data yet for this period.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
          {list.slice(0, 10).map((entry: {
            user: { id: string; username: string; rank: string; avatarUrl?: string }
            totalScore: number
            streak?: number
            wins?: number
          }, i: number) => {
            const medals = ['🥇', '🥈', '🥉']
            const isMe = entry.user?.id === currentUserId
            return (
              <div
                key={entry.user?.id ?? i}
                className={`flex items-center gap-4 px-5 py-3.5 transition-all duration-300 relative ${
                  isMe 
                    ? 'bg-violet-50 dark:bg-violet-500/10 shadow-[inset_4px_0_0_0_#8b5cf6] dark:shadow-[inset_4px_0_0_0_#8b5cf6,inset_0_0_20px_rgba(139,92,246,0.1)]' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 shadow-[inset_4px_0_0_0_transparent]'
                }`}
              >
                <div className={`w-8 text-center font-bold text-lg ${isMe ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {medals[i] ?? <span className={isMe ? '' : 'text-slate-500 dark:text-slate-400 text-sm'}>{i + 1}</span>}
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-md">
                  {entry.user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${entry.user?.id}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-300 transition">
                    {entry.user?.username ?? 'Unknown'} {isMe && <span className="text-violet-600 dark:text-violet-400 text-xs ml-1 font-semibold">(you)</span>}
                  </Link>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{entry.user?.rank}</div>
                </div>
                {entry.streak !== undefined && (
                  <div className="hidden md:flex items-center gap-1 text-xs text-orange-400">
                    <Flame className="w-3 h-3" />
                    {entry.streak}d
                  </div>
                )}
                <div className="text-base font-bold text-violet-600 dark:text-violet-400">{formatScore(entry.totalScore)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
