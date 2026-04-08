'use client'
export const runtime = 'edge';

import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Swords, Plus, ChevronRight, Clock, CheckCircle, XCircle, LayoutDashboard, Zap } from 'lucide-react'


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
    if (action === 'accept') {
      // Navigate to the match detail page where opponent picks their tasks
      window.location.href = `/matches/${matchId}?accept=1`
      return
    }
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
    <div className="space-y-10 animate-fadeInUp mb-24 md:mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 mt-4">
        <div className="flex-1">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-violet-500 transition-all mb-4 bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
            Matches <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-600 dark:from-rose-400 dark:to-violet-400">⚔️</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-500" />
            {active.length} active {active.length === 1 ? 'duel' : 'duels'} in progress
          </p>
        </div>
        <Link
          href="/matches/new"
          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-600/25 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Challenge</span>
        </Link>
      </div>

      <div className="grid gap-10">
        {/* Pending section */}
        {pending.length > 0 && (
          <Section title="Incoming Challenges" count={pending.length} color="text-amber-500" icon={<Clock className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-5">
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
          <Section title="Active Duels" count={active.length} color="text-emerald-500" icon={<Zap className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-5">
              {active.map((m: MatchItem) => (
                <MatchCard key={m.id} match={m} currentUserId={userId} />
              ))}
            </div>
          </Section>
        ) : (
          pending.length === 0 && (
            <div className="py-16 text-center glass rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
              <Swords className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">No active matches found</p>
              <Link href="/matches/new" className="mt-5 text-sm font-semibold text-white bg-violet-600 px-6 py-3 rounded-xl shadow-lg hover:bg-violet-500 transition-all">
                Start a Challenge
              </Link>
            </div>
          )
        )}

        {/* History */}
        {completed.length > 0 && (
          <Section title="Match History" count={completed.length} color="text-slate-400" icon={<CheckCircle className="w-5 h-5" />}>
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
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className={`${color} opacity-80`}>{icon}</div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          {count}
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
    <div 
      className={`glass rounded-2xl p-5 lg:p-6 border border-white/40 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 relative shadow-md hover:shadow-lg transition-all group animate-fadeInUp ${isCompact ? 'opacity-75 hover:opacity-100' : ''}`}
    >
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
            {opponent.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-0.5">Opponent</div>
            <Link href={`/profile/${opponent.id}`} className="text-base font-semibold text-slate-900 dark:text-white hover:text-violet-500 transition truncate underline decoration-violet-500/20 underline-offset-4">
              {opponent.username}
            </Link>
            <div className="text-xs text-slate-500 capitalize mt-0.5">{opponent.rank}</div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </div>
      </div>

      {!isCompact && (
        <>
          {/* Match Tasks */}
          <div className="space-y-2 mb-5">
            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">Tasks</div>
            {match.matchTasks && match.matchTasks.slice(0, 3).map((task, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <span 
                  className="w-1.5 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate flex-1">{task.content}</span>
              </div>
            ))}
            {match.matchTasks && match.matchTasks.length > 3 && (
               <div className="text-xs text-slate-500 dark:text-slate-400 px-1">+ {match.matchTasks.length - 3} more tasks</div>
            )}
          </div>

          {/* Bet */}
          {match.bet && (
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/50 dark:border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-emerald-500" /> &quot;{match.bet.content}&quot;</span>
              <div className="flex gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${match.bet.challengerApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} title="Challenger" />
                <span className={`w-2.5 h-2.5 rounded-full ${match.bet.opponentApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} title="Opponent" />
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-2">
        {match.status === 'ACTIVE' && (
          <Link
            href={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95"
          >
            Enter Match <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {isPendingForMe && onRespond && (
          <>
            <button
              onClick={() => onRespond(match.id, 'accept')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-md active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => onRespond(match.id, 'decline')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold py-3 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        )}

        {(match.status === 'COMPLETED' || match.status === 'DECLINED') && (
          <Link
            href={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium py-3 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            View Result <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {match.status === 'PENDING' && !isPendingForMe && (
          <div className="flex-1 text-center text-xs font-medium text-slate-500 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
            Awaiting confirmation...
          </div>
        )}
      </div>
    </div>
  )
}
