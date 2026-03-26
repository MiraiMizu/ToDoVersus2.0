'use client'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  Flame,
  Sword,
  Swords,
  Trophy,
  TrendingUp,
  Plus,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  Medal,
  User,
} from 'lucide-react'
import ActivityForm from '@/components/ActivityForm'
import { formatScore } from '@/lib/scoring'
import { getRank, getRankProgress, getNextRank } from '@/lib/ranks'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 animate-pulse">
      <div className="h-3 bg-slate-800 rounded w-1/2 mb-3" />
      <div className="h-8 bg-slate-800 rounded w-1/3" />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  sub?: string
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-500/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

const NAV_CARDS = [
  {
    href: '/matches',
    label: 'Matches',
    icon: Swords,
    color: 'from-rose-500 to-orange-600',
    bg: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
    desc: 'Challenge & compete',
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    color: 'from-yellow-500 to-amber-600',
    bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40',
    desc: 'See world rankings',
  },
  {
    href: '/achievements',
    label: 'Badges',
    icon: Medal,
    color: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40',
    desc: 'Unlock achievements',
  },
  {
    href: null,
    label: 'Profile',
    icon: User,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
    desc: 'Your stats & history',
  },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const today = new Date().toISOString().split('T')[0]

  const { data: userdata, isLoading: userLoading } = useSWR(userId ? `/api/users/${userId}` : null, fetcher)
  const { data: activitiesData, mutate: mutateActivities } = useSWR(
    userId ? `/api/activities?userId=${userId}&date=${today}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )
  const { data: matchesData } = useSWR(userId ? `/api/matches` : null, fetcher)
  const { data: leaderData } = useSWR('/api/scores/leaderboard?period=daily', fetcher, { refreshInterval: 60000 })

  const user = userdata?.user
  const activities = activitiesData?.activities ?? []
  const matches = matchesData?.matches ?? []
  const leaders = leaderData?.leaderboard ?? []

  const todayScore = activities.reduce((sum: number, a: { score: number }) => sum + a.score, 0)
  const activeMatches = matches.filter((m: { status: string }) => m.status === 'ACTIVE')
  const pendingMatches = matches.filter(
    (m: { status: string; opponentId: string }) =>
      m.status === 'PENDING' && m.opponentId === userId
  )

  const rank = user ? getRank(user.allTimeScore) : null
  const rankProgress = user ? getRankProgress(user.allTimeScore) : 0
  const nextRank = user ? getNextRank(user.allTimeScore) : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {greeting},{' '}
            <span className="text-violet-400">{session?.user?.name}</span> 👋
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/matches/new"
          id="challenge-button"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Challenge</span>
        </Link>
      </div>

      {/* Pending match alerts */}
      {pendingMatches.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-400 font-medium text-sm">
            <Sword className="w-4 h-4" />
            You have {pendingMatches.length} pending challenge{pendingMatches.length > 1 ? 's' : ''}!
            <Link href="/matches" className="ml-auto text-amber-300 hover:text-amber-200 transition flex items-center gap-1 text-xs">
              View <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Hub Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {NAV_CARDS.map(({ href, label, icon: Icon, color, bg, desc }) => {
          const resolvedHref = href ?? (userId ? `/profile/${userId}` : '/profile')
          return (
            <Link
              key={label}
              href={resolvedHref}
              id={`nav-card-${label.toLowerCase()}`}
              className={`glass border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 group ${bg}`}
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{label}</div>
                <div className="text-[11px] text-slate-500 leading-tight">{desc}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {userLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={Zap}
              label="Today's Score"
              value={formatScore(todayScore)}
              color="bg-gradient-to-br from-violet-500 to-indigo-600"
              sub={`${activities.length} activities`}
            />
            <StatCard
              icon={TrendingUp}
              label="All-Time Score"
              value={user ? formatScore(user.allTimeScore) : '—'}
              color="bg-gradient-to-br from-blue-500 to-cyan-600"
            />
            <StatCard
              icon={Flame}
              label="Streak 🔥"
              value={`${user?.streak ?? 0}d`}
              color="bg-gradient-to-br from-rose-500 to-orange-600"
              sub={user?.streak ? 'Keep it going!' : 'Start your streak!'}
            />
            <StatCard
              icon={Sword}
              label="Active Matches"
              value={activeMatches.length}
              color="bg-gradient-to-br from-emerald-500 to-teal-600"
              sub={activeMatches.length > 0 ? 'In battle!' : 'No active matches'}
            />
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Log activity + today's list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Activity form */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              Log Activity
            </h2>
            <ActivityForm
              onSuccess={() => {
                mutateActivities()
              }}
            />
          </div>

          {/* Today's activities */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Today&apos;s Activities
              <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {activities.length}
              </span>
            </h2>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No activities yet today. Log your first one! 🚀
              </div>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 8).map((a: {
                  id: string
                  name: string
                  durationMinutes: number
                  score: number
                  category: { name: string; weight: number; color: string }
                }) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl hover:bg-slate-900/80 transition-colors"
                  >
                    <div
                      className="w-2 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: a.category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{a.name}</div>
                      <div className="text-xs text-slate-500">
                        {Math.floor(a.durationMinutes / 60)}h {a.durationMinutes % 60}m ·{' '}
                        {a.category.name} (×{a.category.weight})
                      </div>
                    </div>
                    <div className="text-sm font-bold text-violet-400">+{formatScore(a.score)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Rank card */}
          {user && rank && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-semibold text-white">Your Rank</h2>
              </div>
              {/* Big rank display */}
              <div className="text-center mb-4">
                <div
                  className="text-4xl font-extrabold mb-1"
                  style={{ background: `linear-gradient(135deg, ${rank.color}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {rank.icon} {rank.name}
                </div>
                <div className="text-xs text-slate-500">{formatScore(user.allTimeScore)} total points</div>
              </div>
              {/* Progress bar */}
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${rankProgress}%`,
                    background: `linear-gradient(90deg, ${rank.color}, #7c3aed)`,
                    boxShadow: `0 0 8px ${rank.color}80`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{rankProgress}% complete</span>
                {nextRank && <span>→ {nextRank.icon} {nextRank.name}</span>}
              </div>
            </div>
          )}

          {/* Streak highlight */}
          {user && user.streak > 0 && (
            <div className="glass rounded-2xl p-5 border-rose-500/20 bg-rose-500/5">
              <div className="text-center">
                <div className="text-5xl mb-2 animate-pulse-glow">🔥</div>
                <div className="text-3xl font-extrabold text-white">{user.streak}</div>
                <div className="text-sm text-rose-400 font-semibold">Day Streak</div>
                <div className="text-xs text-slate-500 mt-1">Don&apos;t break it!</div>
              </div>
            </div>
          )}

          {/* Daily Leaderboard */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Today&apos;s Top
              </h2>
              <Link href="/leaderboard" className="text-xs text-violet-400 hover:text-violet-300 transition flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {leaders.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">No logs today yet</div>
            ) : (
              <div className="space-y-2">
                {leaders.slice(0, 5).map((entry: {
                  user: { id: string; username: string; rank: string }
                  totalScore: number
                }, i: number) => {
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div
                      key={entry.user?.id ?? i}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${entry.user?.id === userId ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-slate-800/30'}`}
                    >
                      <span className="text-base w-6 text-center">{medals[i] ?? `${i + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {entry.user?.username ?? 'Unknown'}
                          {entry.user?.id === userId && <span className="text-violet-400 text-xs ml-1">(you)</span>}
                        </div>
                        <div className="text-xs text-slate-500">{entry.user?.rank}</div>
                      </div>
                      <div className="text-sm font-bold text-violet-400">{formatScore(entry.totalScore)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active matches quick view */}
          {activeMatches.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sword className="w-4 h-4 text-rose-400" />
                  Active Battles
                </h2>
                <Link href="/matches" className="text-xs text-violet-400 hover:text-violet-300 transition">
                  All
                </Link>
              </div>
              <div className="space-y-2">
                {activeMatches.slice(0, 3).map((m: {
                  id: string
                  challenger: { id: string; username: string }
                  opponent: { id: string; username: string }
                }) => {
                  const opponent = m.challenger.id === userId ? m.opponent : m.challenger
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center gap-3 p-2.5 bg-slate-900/60 rounded-xl hover:bg-slate-800/60 transition"
                    >
                      <div className="w-7 h-7 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {opponent.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">vs {opponent.username}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
