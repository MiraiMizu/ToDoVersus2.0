'use client'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  Flame,
  Sword,
  Swords,
  TrendingUp,
  ChevronRight,
  Zap,
  Clock,
  Calendar,
} from 'lucide-react'
import { formatScore } from '@/lib/scoring'
import { useMemo } from 'react'
import PerformanceChart from '@/components/PerformanceChart'
import ActivitySummaryChart from '@/components/ActivitySummaryChart'
import StatCounter from '@/components/StatCounter'
import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function SkeletonCard() {
  return (
    <div className="glass rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between gap-6 min-h-[180px] animate-pulse">
      <div className="flex items-start justify-between w-full">
        <div className="flex-1 pr-4">
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded-full w-2/3 mb-4" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-3/4" />
        </div>
        <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700/50 rounded-2xl shrink-0" />
      </div>
      <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-1/3 mt-auto" />
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
    <div className="glass rounded-3xl p-5 md:p-6 flex flex-col justify-between hover:border-violet-500/40 transition-all duration-500 relative group min-h-[150px] shadow-sm hover:shadow-[0_12px_30px_rgba(124,58,237,0.08)] overflow-hidden bg-white/60 dark:bg-slate-900/40 cursor-pointer border border-white/40 dark:border-white/5">
      <div className="relative z-10 w-full flex flex-col justify-between h-full">
        <div className="flex justify-between items-start gap-3 mb-3">
           <div className="flex-1 min-w-0">
             <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2 leading-none truncate">{label}</span>
             <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">
               {isValueNumeric && typeof value === 'number' ? (
                 <StatCounter value={value} />
               ) : (
                 value
               )}
             </div>
           </div>
           <div className={`w-11 h-11 md:w-12 md:h-12 ${color} rounded-xl flex items-center justify-center shadow-md shadow-black/10 shrink-0 group-hover:scale-105 transition-all duration-300 border border-white/20 dark:border-white/10`}>
             <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
           </div>
        </div>

        {sub && (
          <div className="mt-auto">
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 inline-block">
              {sub}
            </div>
          </div>
        )}
      </div>
      
      {/* Background Glow */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-violet-500/8 dark:bg-violet-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
    { refreshInterval: 45000 }
  )
  const { data: matchesData } = useSWR(userId ? `/api/matches` : null, fetcher)
  const { data: perfData } = useSWR('/api/user/performance', fetcher)

  const user = userdata?.user
  const activities = activitiesData?.activities ?? []
  const matches = matchesData?.matches ?? []
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
    <div className="space-y-10 animate-fadeInUp mb-24 md:mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 mt-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-3">
            {greeting},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">{session?.user?.name}</span> 👋
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium bg-white/50 dark:bg-white/5 w-fit px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
             <Calendar className="w-3.5 h-3.5 text-violet-500" />
             {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {userLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={Zap}
              label="Today's Gain"
              value={todayScore}
              isValueNumeric={true}
              color="bg-gradient-to-br from-violet-500 to-indigo-600"
              sub={`${activities.length} entries`}
              href="/todo"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Power"
              value={user?.allTimeScore ?? 0}
              isValueNumeric={true}
              color="bg-gradient-to-br from-blue-500 to-cyan-600"
              href={`/profile/${userId}`}
            />
            <StatCard
              icon={Flame}
              label="Active Streak"
              value={`${user?.streak ?? 0}d`}
              color="bg-gradient-to-br from-rose-500 to-orange-600"
              sub={user?.streak ? 'Legendary!' : 'Push Harder!'}
              href={`/profile/${userId}`}
            />
            <StatCard
              icon={Sword}
              label="Total Battles"
              value={activeMatches.length}
              color="bg-gradient-to-br from-emerald-500 to-teal-600"
              sub={activeMatches.length > 0 ? 'Duel Active' : 'Resting...'}
              href="/matches"
            />
          </>
        )}
      </div>

      {/* Pending match alerts */}
      {pendingMatches.length > 0 && (
        <div className="bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:shadow-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-amber-800 dark:text-amber-400 font-black text-sm uppercase tracking-widest">
            <div className="w-12 h-12 bg-amber-200/50 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <Sword className="w-6 h-6" />
            </div>
            <div>
               <div className="text-lg leading-tight">Incoming Challenges</div>
               <div className="text-[10px] opacity-70">You have {pendingMatches.length} pending match requests!</div>
            </div>
          </div>
          <Link href="/matches" className="bg-amber-600 hover:bg-amber-500 px-8 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-600/30 active:scale-95">
             Review Battles
          </Link>
        </div>
      )}

      {/* Performance Tracking Hub */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8">
           <div className="glass rounded-3xl p-6 lg:p-10 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/50 overflow-hidden relative shadow-lg">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                   <div>
                     <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Performance</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Your productivity trend over time</p>
                   </div>
                </div>
                <PerformanceChart data={performanceData} />
              </div>
           </div>
        </div>
        <div className="lg:col-span-4">
           <div className="glass rounded-3xl p-6 lg:p-10 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/50 h-full shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Activity Mix</h2>
              <ActivitySummaryChart data={categorySummary} />
           </div>
        </div>
      </div>

      {/* Activity Logs Section */}
      <div className="glass rounded-3xl p-6 lg:p-10 border border-white/40 dark:border-white/5 bg-white/30 dark:bg-slate-900/40 relative shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <Clock className="w-5 h-5 text-violet-500" />
              Today's Log
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Your completed activities for today</p>
          </div>
          <Link href="/todo" className="w-full md:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-violet-600/20 active:scale-95 text-center">
            Log Progress ✏️
          </Link>
        </div>
        
        {activities.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center">
            <Zap className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6 animate-pulse" />
            <p className="text-slate-400 dark:text-slate-600 text-sm font-black uppercase tracking-[0.4em]">Battlefield is currently silent</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {activities.slice(0, 10).map((a: any) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-6 p-6 bg-white/60 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-3xl hover:bg-white dark:hover:bg-slate-800/80 transition-all group shadow-sm hover:shadow-xl"
              >
                <div className="w-3 h-14 rounded-full flex-shrink-0 group-hover:scale-y-110 transition-transform shadow-sm" style={{ backgroundColor: a.category.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">{a.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-300 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{Math.floor(a.durationMinutes / 60)}H {a.durationMinutes % 60}M</span>
                    <span className="text-violet-500 dark:text-violet-400">·</span>
                    <span className="opacity-80">{a.category.name}</span>
                  </div>
                </div>
                <div className="text-3xl font-black text-violet-600 dark:text-violet-400 drop-shadow-sm">+{formatScore(a.score)}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Rivals Section (Quick Peek) */}
      <div className="glass rounded-3xl p-6 lg:p-10 border border-white/40 dark:border-white/5 bg-white/30 dark:bg-slate-900/40 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
            <Swords className="w-5 h-5 text-rose-500" />
            Active Matches
          </h2>
          <Link href="/matches" className="text-xs font-medium text-rose-600 bg-rose-500/10 dark:bg-rose-500/10 px-4 py-1.5 rounded-full hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
            All Matches
          </Link>
        </div>
        
        {activeMatches.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMatches.slice(0, 3).map((m: any) => {
              const opponent = m.challenger.id === userId ? m.opponent : m.challenger
              return (
                <Link 
                  key={m.id} 
                  href={`/matches/${m.id}`}
                  className="group flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-2xl transition-all hover:bg-white dark:hover:bg-slate-800/80 hover:scale-[1.02] shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
                    {opponent.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">vs {opponent.username}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active match</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-rose-500 transition-all" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-slate-400 dark:text-slate-500 text-sm">No active matches</p>
            <Link href="/matches" className="mt-3 text-xs text-violet-500 font-medium hover:underline">Start a match →</Link>
          </div>
        )}
      </div>
      
      {/* Footer Visual Filler */}
      <div className="h-20" />
    </div>
  )
}
