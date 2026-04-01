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
    <div className="glass rounded-[2.5rem] p-7 flex flex-col justify-between hover:border-violet-500/60 transition-all duration-700 relative group min-h-[170px] shadow-sm hover:shadow-[0_20px_50px_rgba(124,58,237,0.1)] overflow-hidden bg-white/50 dark:bg-slate-900/40 cursor-pointer border border-white/40 dark:border-white/5">
      <div className="relative z-10 w-full flex flex-col justify-between h-full">
        <div className="flex justify-between items-start gap-4 mb-4">
           <div>
             <span className="block text-[11px] md:text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-[0.25em] mb-2 leading-none">{label}</span>
             <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter drop-shadow-sm">
               {isValueNumeric && typeof value === 'number' ? (
                 <StatCounter value={value} />
               ) : (
                 value
               )}
             </div>
           </div>
           <div className={`w-14 h-14 md:w-16 md:h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 border border-white/25 dark:border-white/10`}>
             <Icon className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-md" />
           </div>
        </div>

        {sub && (
          <div className="mt-auto">
            <div className="text-[11px] md:text-xs font-black text-slate-600 dark:text-slate-200 bg-white/80 dark:bg-slate-800/60 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-white/5 inline-block text-left uppercase tracking-widest shadow-sm">
              {sub}
            </div>
          </div>
        )}
      </div>
      
      {/* Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
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
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-12 animate-fadeInUp mb-32 md:mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 mt-4">
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
            {greeting},<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">{session?.user?.name}</span> 👋
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300 text-xs md:text-sm font-black uppercase tracking-[0.2em] bg-white/50 dark:bg-white/5 w-fit px-4 py-2 rounded-full border border-slate-200/50 dark:border-white/5">
             <Calendar className="w-4 h-4 text-violet-500" />
             {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
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
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8">
           <div className="glass rounded-[3rem] p-8 lg:p-12 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/50 overflow-hidden relative shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                   <div>
                     <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Your Performance</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Active productivity trend over time</p>
                   </div>
                </div>
                <PerformanceChart data={performanceData} />
              </div>
           </div>
        </div>
        <div className="lg:col-span-4">
           <div className="glass rounded-[3rem] p-8 lg:p-12 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/50 h-full shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-10">Activity Mix</h2>
              <ActivitySummaryChart data={categorySummary} />
           </div>
        </div>
      </div>

      {/* Activity Logs Section */}
      <div className="glass rounded-[3rem] p-8 lg:p-12 border border-white/40 dark:border-white/5 bg-white/30 dark:bg-slate-900/40 relative shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
              <Clock className="w-10 h-10 text-violet-500" />
              DAILY SUMMARY
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-3">Live feed of your task accomplishments</p>
          </div>
          <Link href="/todo" className="w-full md:w-auto px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-violet-600/20 active:scale-95 text-center">
            Log New Progress ✏️
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
      <div className="glass rounded-[3rem] p-8 lg:p-12 border border-white/40 dark:border-white/5 bg-white/30 dark:bg-slate-900/40 shadow-2xl">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
            <Swords className="w-8 h-8 text-rose-500" />
            LIVE BATTLES
          </h2>
          <Link href="/matches" className="text-xs font-black text-rose-600 bg-rose-500/10 dark:bg-rose-500/10 px-6 py-2.5 rounded-full uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
            All Matches
          </Link>
        </div>
        
        {activeMatches.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMatches.slice(0, 3).map((m: any) => {
              const opponent = m.challenger.id === userId ? m.opponent : m.challenger
              return (
                <Link 
                  key={m.id} 
                  href={`/matches/${m.id}`}
                  className="group flex items-center gap-6 p-6 bg-white/60 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 rounded-[2.5rem] transition-all hover:bg-white dark:hover:bg-slate-800/80 hover:scale-[1.05] shadow-lg shadow-black/5"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl flex items-center justify-center text-xl font-black text-white shrink-0 group-hover:-rotate-6 transition-transform shadow-lg">
                    {opponent.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter">vs {opponent.username}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-[0.2em] mt-2">Active Duel</div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-200 dark:text-slate-700 group-hover:translate-x-1 group-hover:text-rose-500 transition-all" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
            <p className="text-slate-400 dark:text-slate-600 text-xs font-black uppercase tracking-widest">No active rivals currently matched</p>
            <Link href="/matches" className="mt-6 text-xs text-violet-500 font-bold hover:underline">Start a new match →</Link>
          </div>
        )}
      </div>
      
      {/* Footer Visual Filler */}
      <div className="h-20" />
    </div>
  )
}
