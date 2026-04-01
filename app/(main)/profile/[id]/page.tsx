'use client'

import { use } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatScore } from '@/lib/scoring'
import { getRank, getRankProgress } from '@/lib/ranks'
import { User, Flame, Trophy, Shield, Medal, Calendar, LayoutDashboard } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RARITY_COLORS: Record<string, string> = {
  Common: 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40',
  Rare: 'border-blue-500/40 bg-blue-50/50 dark:bg-transparent',
  Epic: 'border-violet-500/40 bg-violet-50/50 dark:bg-transparent',
  Legendary: 'border-amber-500/40 bg-amber-50/50 dark:bg-transparent',
}

import { ThemeToggle } from '@/components/ThemeToggle'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const isMe = session?.user?.id === id

  const { data } = useSWR(id ? `/api/users/${id}` : null, fetcher)
  const user = data?.user

  if (!user) {
    return <div className="p-6 text-center text-slate-500">Loading profile...</div>
  }

  const rank = getRank(user.allTimeScore)
  const progress = getRankProgress(user.allTimeScore)
  const earnedAchievements = user.achievements ?? []
  const totalMatches = (user._count?.challengedMatches ?? 0) + (user._count?.opponentMatches ?? 0)
  const wins = user._count?.wonMatches ?? 0

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fadeInUp space-y-6">
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/40 p-3 rounded-2xl glass mb-2">
        <Link href="/dashboard" id="back-to-dashboard-profile" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition ml-2">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        {isMe && <ThemeToggle />}
      </div>
      {/* Profile header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.username}</h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{isMe ? user.email : ''}</div>
            <div
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold px-3 py-1 rounded-full shadow-sm"
              style={{ background: `${rank.color}15`, color: rank.color, borderColor: `${rank.color}30`, border: '1px solid' }}
            >
              <Shield className="w-3.5 h-3.5" />
              {rank.icon} {rank.name}
            </div>

            {/* Rank progress */}
            <div className="mt-4 max-w-xs mx-auto md:mx-0">
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${rank.color}, #7c3aed)` }}
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{progress}% to next rank</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 text-center w-full md:w-auto mt-4 md:mt-0">
            <div className="glass rounded-xl p-3 border border-slate-200 dark:border-slate-800/60 shadow-sm">
              <div className="text-xl font-bold text-violet-600 dark:text-violet-400">{formatScore(user.allTimeScore)}</div>
              <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-tight mt-1">All-time pts</div>
            </div>
            <div className="glass rounded-xl p-3 border border-slate-200 dark:border-slate-800/60 shadow-sm">
              <div className="text-xl font-bold text-orange-500 dark:text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                {user.streak}
              </div>
              <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-tight mt-1">Day streak</div>
            </div>
            <div className="glass rounded-xl p-3 border border-slate-200 dark:border-slate-800/60 shadow-sm">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{wins}</div>
              <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-tight mt-1">Match wins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Match stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="glass rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <Trophy className="w-6 h-6 text-yellow-500 dark:text-yellow-400 mx-auto mb-2 drop-shadow-sm" />
          <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{totalMatches}</div>
          <div className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1">Total matches</div>
        </div>
        <div className="glass rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <Medal className="w-6 h-6 text-violet-500 dark:text-violet-400 mx-auto mb-2 drop-shadow-sm" />
          <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{earnedAchievements.length}</div>
          <div className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1">Badges earned</div>
        </div>
        <div className="glass rounded-2xl p-4 md:p-5 text-center border border-slate-200 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <Calendar className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 drop-shadow-sm" />
          <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          </div>
          <div className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1">Member since</div>
        </div>
      </div>

      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <div className="glass rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Medal className="w-5 h-5 text-violet-500 dark:text-violet-400 drop-shadow-sm" />
            Achievements ({earnedAchievements.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {earnedAchievements.map((ua: { achievement: { id: string; name: string; description: string; icon: string; rarity: string; code: string } }) => (
              <div
                key={ua.achievement.id}
                title={ua.achievement.description}
                className={`rounded-xl border p-3 text-center cursor-default hover:scale-105 transition-all duration-300 hover:shadow-lg shadow-sm ${RARITY_COLORS[ua.achievement.rarity]}`}
              >
                <div className="text-3xl mb-1 drop-shadow-sm">{ua.achievement.icon}</div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{ua.achievement.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {user.activityLogs && user.activityLogs.length > 0 && (
        <div className="glass rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm mt-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
             <LayoutDashboard className="w-5 h-5 text-violet-500 dark:text-violet-400 drop-shadow-sm" />
             Recent Activity
          </h2>
          <div className="space-y-2">
            {user.activityLogs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                 <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: log.category.color }} />
                 <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{log.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                       {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m · {log.category.name} · {log.date}
                    </div>
                 </div>
                 <div className="text-sm font-bold text-violet-600 dark:text-violet-400">+{formatScore(log.score)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
