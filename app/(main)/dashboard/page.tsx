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
} from 'lucide-react'
import ActivityForm from '@/components/ActivityForm'
import PersonalTodos from '@/components/PersonalTodos'
import { ScrollTimePicker } from '@/components/ScrollTimePicker'
import { formatScore } from '@/lib/scoring'
import { getRank, getRankProgress, getNextRank } from '@/lib/ranks'
import { useState, useMemo } from 'react'
import PerformanceChart from '@/components/PerformanceChart'
import ActivitySummaryChart from '@/components/ActivitySummaryChart'
import StatCounter from '@/components/StatCounter'
import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function SkeletonCard() {
  return (
    <div className="glass rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 min-h-[160px] animate-pulse">
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
}: {
  icon: React.ElementType
  label: string
  value: string | number
  isValueNumeric?: boolean
  color: string
  sub?: string
}) {
  return (
    <div className="glass rounded-3xl p-5 md:p-6 flex flex-col justify-between hover:border-violet-500/40 transition-all duration-500 relative group min-h-[150px] shadow-sm hover:shadow-xl hover:shadow-violet-500/5 overflow-hidden">
      <div className="relative z-10 w-full flex flex-col justify-between h-full">
        <div className="flex justify-between items-start gap-4 mb-4">
           <div>
             <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</span>
             <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
               {isValueNumeric && typeof value === 'number' ? (
                 <StatCounter value={value} />
               ) : (
                 value
               )}
             </div>
           </div>
           {/* Icon */}
           <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
             <Icon className="w-6 h-6 text-white drop-shadow-md" />
           </div>
        </div>

        {sub && (
          <div className="mt-auto">
            <div className="text-[10px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 inline-block text-left uppercase tracking-wider h-fit">
              {sub}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const today = new Date().toISOString().split('T')[0]
  
  const [activeLogTask, setActiveLogTask] = useState<{ matchId: string, matchTaskId: string, categoryId: string, taskName: string } | null>(null)
  const [loggingTask, setLoggingTask] = useState(false)

  const { data: userdata, isLoading: userLoading } = useSWR(userId ? `/api/users/${userId}` : null, fetcher)
  const { data: activitiesData, mutate: mutateActivities } = useSWR(
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

  const rank = user ? getRank(user.allTimeScore) : null
  const rankProgress = user ? getRankProgress(user.allTimeScore) : 0
  const nextRank = user ? getNextRank(user.allTimeScore) : null

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

  const handleQuickLog = async (hours: number, minutes: number) => {
    if (!activeLogTask) return
    setLoggingTask(true)
    
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: activeLogTask.taskName,
        categoryId: activeLogTask.categoryId,
        hours,
        minutes,
        matchId: activeLogTask.matchId,
        matchTaskId: activeLogTask.matchTaskId
      }),
    })
    
    setLoggingTask(false)
    setActiveLogTask(null)
    mutateActivities()
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10 animate-fadeInUp mb-32 md:mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {greeting},{' '}
            <span className="text-violet-600 dark:text-violet-400">{session?.user?.name}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">
             {activeMatches.length} active battle{activeMatches.length !== 1 ? 's' : ''} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/matches/new"
          id="challenge-button"
          className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-violet-500/25 active:scale-95 flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>New Challenge</span>
        </Link>
      </div>

      {/* Pending match alerts */}
      {pendingMatches.length > 0 && (
        <div className="bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm">
            <Sword className="w-4 h-4" />
            You have {pendingMatches.length} pending challenge{pendingMatches.length > 1 ? 's' : ''}!
            <Link href="/matches" className="ml-auto text-amber-600 dark:text-amber-300 hover:opacity-80 transition flex items-center gap-1 text-xs">
              View <ChevronRight className="w-3 h-3" />
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
            />
            <StatCard
              icon={TrendingUp}
              label="All-Time Score"
              value={user?.allTimeScore ?? 0}
              isValueNumeric={true}
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <PerformanceChart data={performanceData} />
        </div>
        <div className="lg:col-span-1">
          <ActivitySummaryChart data={categorySummary} />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Left Column: Command Center (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <PersonalTodos />

          <div className="glass rounded-2xl p-5 lg:p-6 opacity-100">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              General Productivity
            </h2>
            <ActivityForm
              onSuccess={() => {
                mutateActivities()
              }}
            />
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              Today&apos;s Logs
              <span className="ml-auto text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {activities.length}
              </span>
            </h2>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-500 text-sm">
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
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors"
                  >
                    <div
                      className="w-2 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: a.category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.name}</div>
                      <div className="text-xs text-slate-500">
                        {Math.floor(a.durationMinutes / 60)}h {a.durationMinutes % 60}m ·{' '}
                        {a.category.name} (×{a.category.weight})
                      </div>
                    </div>
                    <div className="text-sm font-bold text-violet-600 dark:text-violet-400">+{formatScore(a.score)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Matches & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active matches quick view */}
          {activeMatches.length > 0 ? (
            <div className="glass rounded-2xl p-5 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sword className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  Active Battles
                </h2>
                <Link href="/matches" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition">
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {activeMatches.slice(0, 3).map((m: {
                  id: string
                  challenger: { id: string; username: string }
                  opponent: { id: string; username: string }
                  matchTasks: { id: string; content: string; categoryId: string; category: { name: string, weight: number } }[]
                }) => {
                  const opponent = m.challenger.id === userId ? m.opponent : m.challenger
                  return (
                    <div key={m.id} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/20 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {opponent.username[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">vs {opponent.username}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Live Match</div>
                        </div>
                        <Link href={`/matches/${m.id}`} className="text-xs text-rose-500 hover:text-rose-600 font-medium transition">View</Link>
                      </div>
                      
                      <div className="space-y-1.5 mt-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                        <div className="text-xs text-slate-500 mb-1">Click a task to log time:</div>
                        {m.matchTasks && m.matchTasks.map(task => (
                           <button 
                             key={task.id}
                             onClick={() => setActiveLogTask({
                               matchId: m.id,
                               matchTaskId: task.id,
                               categoryId: task.categoryId,
                               taskName: task.content
                             })}
                             className="w-full flex items-center justify-between text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 px-3 py-2 rounded-lg transition group"
                           >
                              <div>
                                <div className="text-xs font-semibold text-slate-900 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400">{task.content}</div>
                                <div className="text-[10px] text-slate-500 tracking-tight">{task.category?.name} (x{task.category?.weight})</div>
                              </div>
                              <Plus className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition" />
                           </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="glass rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-3xl flex justify-center items-center mb-6 shadow-inner">
                 <Swords className="w-8 h-8 text-slate-400" />
               </div>
               <h3 className="text-slate-900 dark:text-white font-bold text-lg">No Active Battles</h3>
               <p className="text-slate-500 text-sm mt-2 mb-6">Challenge someone to boost your productivity.</p>
               <Link href="/matches/new" className="text-sm font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 px-6 py-3 rounded-xl hover:bg-violet-200 dark:hover:bg-violet-500/20 transition-colors">
                 Start a Match
               </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:gap-6">
             {/* Rank card compact */}
             {user && rank && (
                <div className="glass rounded-3xl p-5 flex flex-col items-center justify-center text-center min-h-[150px]">
                   <Shield className="w-6 h-6 text-violet-500 dark:text-violet-400 mb-3" />
                   <div
                    className="text-2xl font-extrabold"
                    style={{ background: `linear-gradient(135deg, ${rank.color}, #a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                   >
                    {rank.icon} {rank.name}
                   </div>
                   <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider mt-1.5 mb-3 font-semibold">Current Rank</div>
                   <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${rankProgress}%`,
                        background: `linear-gradient(90deg, ${rank.color}, #7c3aed)`,
                      }}
                     />
                   </div>
                </div>
             )}
             
             {/* Streak highlight compact */}
             {user && (
                <div className={`glass rounded-3xl p-5 flex flex-col items-center justify-center text-center min-h-[150px] ${user.streak > 0 ? 'border border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5' : ''}`}>
                   <div className={`text-3xl mb-2 ${user.streak > 0 ? 'animate-pulse-glow drop-shadow-md' : 'opacity-40 grayscale'}`}>🔥</div>
                   <div className={`text-3xl font-black leading-none ${user.streak > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-400'}`}>{user.streak} <span className="text-sm font-medium">days</span></div>
                   <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider mt-2 font-semibold">{user.streak > 0 ? 'Active Streak' : 'No Streak'}</div>
                </div>
             )}
          </div>

          {/* Daily Leaderboard */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                Today&apos;s Top
              </h2>
              <Link href="/leaderboard" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition flex items-center gap-1">
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
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${entry.user?.id === userId ? 'bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                    >
                      <span className="text-base w-6 text-center">{medals[i] ?? `${i + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {entry.user?.username ?? 'Unknown'}
                          {entry.user?.id === userId && <span className="text-violet-600 dark:text-violet-400 text-xs ml-1">(you)</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">{entry.user?.rank}</div>
                      </div>
                      <div className="text-sm font-bold text-violet-600 dark:text-violet-400">{formatScore(entry.totalScore)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {activeLogTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scaleUp">
             <div className="flex justify-between items-center mb-4">
               <div>
                 <div className="text-xs text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider mb-1">Log Match Auto-pilot</div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeLogTask.taskName}</h3>
               </div>
               <button onClick={() => setActiveLogTask(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-500 transition">
                  <Plus className="w-5 h-5 rotate-45" />
               </button>
             </div>
             
             {loggingTask ? (
               <div className="py-12 flex flex-col items-center justify-center space-y-3">
                 <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
                 <div className="text-sm text-slate-500 font-medium">Recording progress...</div>
               </div>
             ) : (
               <ScrollTimePicker 
                 initialHours={0} 
                 initialMinutes={0} 
                 onChange={handleQuickLog} 
                 onClose={() => setActiveLogTask(null)} 
               />
             )}
          </div>
        </div>
      )}
    </div>
  )
}
