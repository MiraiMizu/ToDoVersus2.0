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
  ChevronRight,
  Zap,
  Shield,
  Clock,
  Calendar,
} from 'lucide-react'
import { formatScore } from '@/lib/scoring'
import { getRank, getRankProgress } from '@/lib/ranks'
import { useMemo } from 'react'
import PerformanceChart from '@/components/PerformanceChart'
import ActivitySummaryChart from '@/components/ActivitySummaryChart'
import StatCounter from '@/components/StatCounter'
import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function SkeletonCard() {
  return (
    <div className="glass rounded-[2rem] p-6 md:p-8 flex flex-col justify-between gap-6 min-h-[160px] animate-pulse">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1 pr-4">
          <div className="h-2 md:h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded-full w-2/3 mb-4" />
          <div className="h-8 md:h-10 bg-slate-200 dark:bg-slate-700/50 rounded-lg w-3/4" />
        </div>
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-2xl shrink-0" />
      </div>
      <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-1/3 mt-auto" />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  isValueNumeric = false,
  color,
  sub,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  isValueNumeric?: boolean
  color: string
  sub?: string
  href?: string
}) {
  const CardContent = (
    <div className="glass rounded-[2rem] p-6 flex flex-col justify-between hover:border-violet-500/50 transition-all duration-500 relative group min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-violet-500/10 overflow-hidden bg-white/40 dark:bg-slate-900/40 cursor-pointer">
      <div className="relative z-10 w-full flex flex-col justify-between h-full">
        <div className="flex justify-between items-start gap-4 mb-4">
           <div>
             <span className="block text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">{label}</span>
             <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
               {isValueNumeric && typeof value === 'number' ? (
                 <StatCounter value={value} />
               ) : (
                 value
               )}
             </div>
           </div>
           <div className={`w-12 h-12 md:w-14 md:h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 border border-white/20 dark:border-slate-700/30`}>
             <Icon className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-md" />
           </div>
        </div>

        {sub && (
          <div className="mt-auto">
            <div className="text-[10px] md:text-[11px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/30 inline-block text-left uppercase tracking-widest h-fit">
              {sub}
            </div>
          </div>
        )}
      </div>
      <div className="absolute -inset-2 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const today = new Date().toISOString().split('T')[0]
  
  const { data: userdata, isLoading: userLoading } = useSWR(userId ? `/api/users/${userId}` : null, fetcher)
  const { data: activitiesData } = useSWR(
    userId ? `/api/activities?userId=${userId}&date=${today}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )
  const { data: matchesData } = useSWR(userId ? `/api/matches` : null, fetcher)
  const { data: leaderData } = useSWR('/api/scores/leaderboard?period=daily', fetcher, { refreshInterval: 60000 })
  const { data: perfData } = useSWR('/api/user/performance', fetcher)

  const user = userdata?.user
  const activities = activitiesData?.activities ?? []
  const matches = matchesData?.matches ?? []
  const leaders = leaderData?.leaderboard ?? []
  const performanceData = perfData?.performanceData ?? []

  const todayScore = activities.reduce((sum: number, a: { score: number }) => sum + a.score, 0)
  const activeMatches = matches.filter((m: { status: string }) => m.status === 'ACTIVE')
  const pendingMatches = matches.filter(
    (m: { status: string; opponentId: string }) =>
      m.status === 'PENDING' && m.opponentId === userId
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const categorySummary = useMemo(() => {
    const summary: Record<string, { name: string; value: number; color: string }> = {}
    activities.forEach((a: any) => {
      if (!summary[a.category.name]) {
        summary[a.category.name] = {
          name: a.category.name,
          value: 0,
          color: a.category.color,
        }
      }
      summary[a.category.name].value += a.score
    })
    return Object.values(summary)
  }, [activities])

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10 animate-fadeInUp mb-32 md:mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 mt-4">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            {greeting},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">{session?.user?.name}</span> 👋
          </h1>
          <div className="flex items-center gap-2 mt-4 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
             <Calendar className="w-4 h-4 text-violet-500" />
             {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Pending match alerts */}
      {pendingMatches.length > 0 && (
        <div className="bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-widest">
            <Sword className="w-4 h-4" />
            You have {pendingMatches.length} pending challenge{pendingMatches.length > 1 ? 's' : ''}!
            <Link href="/matches" className="ml-auto bg-amber-200/50 dark:bg-amber-500/20 px-3 py-1 rounded-lg text-amber-800 dark:text-amber-300 hover:opacity-80 transition flex items-center gap-1 text-[10px]">
              View Requests <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {userLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={Zap}
              label="Today's Score"
              value={todayScore}
              isValueNumeric={true}
              color="bg-gradient-to-br from-violet-500 to-indigo-600"
              sub={`${activities.length} activities`}
              href="/todo"
            />
            <StatCard
              icon={TrendingUp}
              label="All-Time Score"
              value={user?.allTimeScore ?? 0}
              isValueNumeric={true}
              color="bg-gradient-to-br from-blue-500 to-cyan-600"
              href={`/profile/${userId}`}
            />
            <StatCard
              icon={Flame}
              label="Streak 🔥"
              value={`${user?.streak ?? 0}d`}
              color="bg-gradient-to-br from-rose-500 to-orange-600"
              sub={user?.streak ? 'Keep it going!' : 'Start your streak!'}
              href={`/profile/${userId}`}
            />
            <StatCard
              icon={Sword}
              label="Active Battles"
              value={activeMatches.length}
              color="bg-gradient-to-br from-emerald-500 to-teal-600"
              sub={activeMatches.length > 0 ? 'In battle!' : 'No active matches'}
              href="/matches"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <PerformanceChart data={performanceData} />
        </div>
        <div className="lg:col-span-1">
          <ActivitySummaryChart data={categorySummary} />
        </div>
      </div>

      {/* Simplified Layout Content */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        
        {/* Productivity Tracking (View Only) */}
        <div className="glass rounded-[2rem] p-6 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 bg-white/30 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-violet-500" />
              Daily Summary
            </h2>
            <Link href="/todo" className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-violet-200 dark:hover:bg-violet-500/20 transition-all">
              Go to To-Do 📝
            </Link>
          </div>
          
          {activities.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Zap className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-slate-500 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">No activities recorded today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 8).map((a: any) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-900/60 border border-slate-100/50 dark:border-slate-800/40 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="w-2.5 h-10 rounded-full flex-shrink-0 group-hover:scale-y-110 transition-transform" style={{ backgroundColor: a.category.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{a.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {Math.floor(a.durationMinutes / 60)}h {a.durationMinutes % 60}m · {a.category.name}
                    </div>
                  </div>
                  <div className="text-xl font-black text-violet-600 dark:text-violet-400">+{formatScore(a.score)}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Rival Tracking & Ranking */}
        <div className="space-y-8">
          {/* Active battles quick access */}
          <div className="glass rounded-[2rem] p-6 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 bg-white/30 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Sword className="w-6 h-6 text-rose-500" />
                Live Battles
              </h2>
              <Link href="/matches" className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-all">
                Match Page ⚔️
              </Link>
            </div>
            {activeMatches.length > 0 ? (
              <div className="space-y-4">
                {activeMatches.slice(0, 3).map((m: any) => {
                  const opponent = m.challenger.id === userId ? m.opponent : m.challenger
                  return (
                    <Link 
                      key={m.id} 
                      href={`/matches/${m.id}`}
                      className="group flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-2xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-[1.02]"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-2xl flex items-center justify-center text-base font-black text-white shrink-0 group-hover:-rotate-6 transition-transform">
                        {opponent.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">vs {opponent.username}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: Active Duel</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-rose-500 transition-all" />
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center">
                <Swords className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">No active duels found</p>
              </div>
            )}
          </div>

          {/* Ranking snippet */}
          <div className="glass rounded-[2rem] p-6 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 bg-white/30 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                World Ranking
              </h2>
              <Link href="/leaderboard" className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-all">
                Full Board 🏆
              </Link>
            </div>
            <div className="space-y-4">
              {leaders.slice(0, 3).map((entry: any, i: number) => {
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <Link
                    href={`/profile/${entry.user?.id}`}
                    key={entry.user?.id || i}
                    className={`flex items-center gap-4 p-4 rounded-3xl transition-all ${entry.user?.id === userId ? 'bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20' : 'bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:scale-[1.01]'}`}
                  >
                    <span className="text-xl w-8 font-black text-slate-400 transition-colors group-hover:text-amber-500">{medals[i] || i + 1}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-300 shrink-0 shadow-inner">
                        {entry.user?.username[0]?.toUpperCase()}
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                        {entry.user?.username}
                        {entry.user?.id === userId && <span className="text-violet-600 dark:text-violet-400 text-[9px] ml-2 font-black tracking-widest border border-violet-200 dark:border-violet-500/30 px-1.5 py-0.5 rounded-full">YOU</span>}
                      </div>
                    </div>
                    <div className="text-lg font-black text-violet-600 dark:text-violet-400">{formatScore(entry.totalScore)}</div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
