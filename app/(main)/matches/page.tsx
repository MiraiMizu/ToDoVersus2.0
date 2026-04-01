'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Swords, Plus, ChevronRight, Clock, CheckCircle, XCircle, LayoutDashboard, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'PENDING', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
  ACTIVE: { label: 'LIVE BATTLE', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Zap },
  COMPLETED: { label: 'FINISHED', color: 'text-slate-500 dark:text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20', icon: CheckCircle },
  DECLINED: { label: 'DECLINED', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
}

export default function MatchesPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const { data, mutate } = useSWR('/api/matches', fetcher, { refreshInterval: 30000 })
  const matches = data?.matches ?? []

  const handleRespond = async (matchId: string, action: 'accept' | 'decline') => {
    await fetch(`/api/matches/${matchId}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    mutate()
  }

  const pending = matches.filter((m: { status: string }) => m.status === 'PENDING')
  const active = matches.filter((m: { status: string }) => m.status === 'ACTIVE')
  const completed = matches.filter((m: { status: string }) => ['COMPLETED', 'DECLINED'].includes(m.status))

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto space-y-12 animate-fadeInUp mb-32 md:mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4 mt-4">
        <div className="flex-1">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 hover:text-violet-500 transition-all uppercase tracking-[0.3em] mb-4 bg-slate-100/50 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200/50 dark:border-white/5">
            <LayoutDashboard className="w-3 h-3" /> Dashboard
          </Link>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            BATTLE<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-600 dark:from-rose-400 dark:to-violet-400">GROUND</span> ⚔️
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-xs font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-500" />
            {active.length} ACTIVE DUELS IN PROGRESS
          </p>
        </div>
        <Link
          href="/matches/new"
          className="flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-violet-600/30 active:scale-95 uppercase tracking-widest whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>New Challenge</span>
        </Link>
      </div>

      <div className="grid gap-12">
        {/* Pending section */}
        {pending.length > 0 && (
          <Section title="Incoming Challenges" count={pending.length} color="text-amber-500" icon={<Clock className="w-6 h-6" />}>
            <div className="grid md:grid-cols-2 gap-6">
              {pending.map((m: MatchItem) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  currentUserId={userId}
                  onRespond={handleRespond}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Active */}
        {active.length > 0 ? (
          <Section title="Live Duels" count={active.length} color="text-emerald-500" icon={<Zap className="w-6 h-6 border-b-2 border-emerald-500" />}>
            <div className="grid md:grid-cols-2 gap-6">
              {active.map((m: MatchItem) => (
                <MatchCard key={m.id} match={m} currentUserId={userId} />
              ))}
            </div>
          </Section>
        ) : (
          pending.length === 0 && (
            <div className="py-24 text-center glass rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
              <Swords className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
              <p className="text-slate-400 dark:text-slate-600 text-sm font-black uppercase tracking-[0.3em]">No active duels found</p>
              <Link href="/matches/new" className="mt-8 text-xs font-black text-white bg-violet-600 px-8 py-4 rounded-2xl shadow-xl hover:bg-violet-500 transition-all uppercase tracking-widest">
                Initiate First Challenge
              </Link>
            </div>
          )
        )}

        {/* History */}
        {completed.length > 0 && (
          <Section title="Combat History" count={completed.length} color="text-slate-400" icon={<CheckCircle className="w-6 h-6" />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map((m: MatchItem) => (
                <MatchCard key={m.id} match={m} currentUserId={userId} isCompact />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

type MatchItem = {
  id: string
  status: string
  challengerId: string
  opponentId: string
  challenger: { id: string; username: string; rank: string }
  opponent: { id: string; username: string; rank: string }
  winner?: { id: string; username: string } | null
  matchTasks?: { id: string; content: string; category: { name: string; weight: number; color: string } }[]
  bet?: { content: string; challengerApproved: boolean; opponentApproved: boolean } | null
  createdAt: string
}

function Section({ title, count, color, icon, children }: { title: string; count: number; color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`${color} opacity-80`}>{icon}</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{title}</h2>
        </div>
        <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">
          {count} Cases
        </span>
      </div>
      <div>{children}</div>
    </div>
  )
}

function MatchCard({
  match,
  currentUserId,
  onRespond,
  isCompact = false,
}: {
  match: MatchItem
  currentUserId?: string
  onRespond?: (id: string, action: 'accept' | 'decline') => void
  isCompact?: boolean
}) {
  const statusInfo = STATUS_STYLES[match.status] ?? STATUS_STYLES.PENDING
  const isChallenger = match.challengerId === currentUserId
  const opponent = isChallenger ? match.opponent : match.challenger
  const isPendingForMe = match.status === 'PENDING' && match.opponentId === currentUserId

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass rounded-[2.5rem] p-6 lg:p-8 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 relative shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group ${isCompact ? 'opacity-80 scale-95 hover:opacity-100 hover:scale-100' : ''}`}
    >
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg group-hover:-rotate-6 transition-transform">
            {opponent.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Combatant</div>
            <Link href={`/profile/${opponent.id}`} className="text-xl font-black text-slate-900 dark:text-white hover:text-violet-500 transition uppercase tracking-tighter truncate underline decoration-violet-500/20 underline-offset-4">
              {opponent.username}
            </Link>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{opponent.rank}</div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </div>
      </div>

      {!isCompact && (
        <>
          {/* Match Tasks */}
          <div className="space-y-3 mb-8">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Engagement Targets</div>
            {match.matchTasks && match.matchTasks.slice(0, 3).map((task, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                <span 
                  className="w-2 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight truncate flex-1">{task.content}</span>
              </div>
            ))}
            {match.matchTasks && match.matchTasks.length > 3 && (
               <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic px-2">+ {match.matchTasks.length - 3} MORE OBJECTIVES</div>
            )}
          </div>

          {/* Bet */}
          {match.bet && (
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-8 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/50 dark:border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between shadow-inner">
              <span className="flex items-center gap-2 uppercase tracking-tight"><Zap className="w-4 h-4 text-emerald-500" /> &quot;{match.bet.content}&quot;</span>
              <div className="flex gap-2">
                <span className={`w-3 h-3 rounded-full ${match.bet.challengerApproved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`} title="Challenger Status" />
                <span className={`w-3 h-3 rounded-full ${match.bet.opponentApproved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`} title="Opponent Status" />
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        {match.status === 'ACTIVE' && (
          <Link
            href={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
          >
            Enter Battlefield <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {isPendingForMe && onRespond && (
          <>
            <button
              onClick={() => onRespond(match.id, 'accept')}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 uppercase tracking-widest"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => onRespond(match.id, 'decline')}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black py-4 rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 uppercase tracking-widest"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        )}

        {(match.status === 'COMPLETED' || match.status === 'DECLINED') && (
          <Link
            href={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black py-4 rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-widest shadow-sm"
          >
            Review Legacy <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {match.status === 'PENDING' && !isPendingForMe && (
          <div className="flex-1 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            Awaiting rival confirmation...
          </div>
        )}
      </div>
    </motion.div>
  )
}
