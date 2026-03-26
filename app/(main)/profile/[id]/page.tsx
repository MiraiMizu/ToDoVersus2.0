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
  Common: 'border-slate-700',
  Rare: 'border-blue-500/40',
  Epic: 'border-violet-500/40',
  Legendary: 'border-amber-500/40',
}

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
      <Link href="/dashboard" id="back-to-dashboard-profile" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition">
        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
      </Link>
      {/* Profile header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            <div className="text-sm text-slate-400 mt-0.5">{isMe ? user.email : ''}</div>
            <div
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: `${rank.color}20`, color: rank.color, borderColor: `${rank.color}40`, border: '1px solid' }}
            >
              <Shield className="w-3.5 h-3.5" />
              {rank.icon} {rank.name}
            </div>

            {/* Rank progress */}
            <div className="mt-3 max-w-xs mx-auto md:mx-0">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${rank.color}, #7c3aed)` }}
                />
              </div>
              <div className="text-xs text-slate-600 mt-1">{progress}% to next rank</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass rounded-xl p-3">
              <div className="text-xl font-bold text-violet-400">{formatScore(user.allTimeScore)}</div>
              <div className="text-xs text-slate-500">All-time pts</div>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="text-xl font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                {user.streak}
              </div>
              <div className="text-xs text-slate-500">Day streak</div>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="text-xl font-bold text-yellow-400">{wins}</div>
              <div className="text-xs text-slate-500">Match wins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Match stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{totalMatches}</div>
          <div className="text-xs text-slate-500">Total matches</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Medal className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{earnedAchievements.length}</div>
          <div className="text-xs text-slate-500">Badges earned</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">
            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          </div>
          <div className="text-xs text-slate-500">Member since</div>
        </div>
      </div>

      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Medal className="w-4 h-4 text-violet-400" />
            Achievements ({earnedAchievements.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {earnedAchievements.map((ua: { achievement: { id: string; name: string; description: string; icon: string; rarity: string; code: string } }) => (
              <div
                key={ua.achievement.id}
                title={ua.achievement.description}
                className={`rounded-xl border p-3 text-center cursor-default hover:scale-105 transition-transform ${RARITY_COLORS[ua.achievement.rarity]}`}
              >
                <div className="text-3xl mb-1">{ua.achievement.icon}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{ua.achievement.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
