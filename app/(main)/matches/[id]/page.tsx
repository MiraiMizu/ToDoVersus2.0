'use client'

import { use } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatScore, formatDuration } from '@/lib/scoring'
import ActivityForm from '@/components/ActivityForm'
import { Swords, Trophy, Flame, Clock, LayoutDashboard } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data, mutate } = useSWR(id ? `/api/matches/${id}` : null, fetcher, { refreshInterval: 30000 })
  const match = data?.match

  if (!match) {
    return (
      <div className="p-6 text-center">
        <div className="text-slate-500">Loading match...</div>
      </div>
    )
  }

  const isChallenger = match.challengerId === userId
  const me = isChallenger ? match.challenger : match.opponent
  const opponent = isChallenger ? match.opponent : match.challenger

  // Compute scores from activity logs
  const myLogs = match.activityLogs.filter((l: { userId: string }) => l.userId === userId)
  const opponentLogs = match.activityLogs.filter((l: { userId: string }) => l.userId !== userId)
  const myTotal = myLogs.reduce((s: number, l: { score: number }) => s + l.score, 0)
  const opponentTotal = opponentLogs.reduce((s: number, l: { score: number }) => s + l.score, 0)
  const maxScore = Math.max(myTotal, opponentTotal, 1)

  const today = new Date().toISOString().split('T')[0]
  const myTodayLogs = myLogs.filter((l: { date: string }) => l.date === today)
  const opponentTodayLogs = opponentLogs.filter((l: { date: string }) => l.date === today)
  const myTodayScore = myTodayLogs.reduce((s: number, l: { score: number }) => s + l.score, 0)
  const opponentTodayScore = opponentTodayLogs.reduce((s: number, l: { score: number }) => s + l.score, 0)

  const isActive = match.status === 'ACTIVE'

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fadeInUp space-y-6">
      <Link href="/matches" id="back-to-matches-detail" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition">
        <LayoutDashboard className="w-3.5 h-3.5" /> Matches
      </Link>
      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {match.status === 'ACTIVE' ? '⚔️ Battle in Progress' : match.status === 'COMPLETED' ? '🏆 Match Complete' : match.status}
          </div>
          {match.winner && (
            <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              🥇 {match.winner.username} wins!
            </div>
          )}
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
              {me.username[0]?.toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{me.username}</div>
            <div className="text-xs text-slate-500">{me.rank}</div>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">{formatScore(myTotal)}</div>
          </div>

          <div className="text-center">
            <div className="text-slate-600 mb-2">
              <Swords className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-sm font-semibold text-slate-400">Total Match Score</div>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
              {opponent.username[0]?.toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{opponent.username}</div>
            <div className="text-xs text-slate-500">{opponent.rank}</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{formatScore(opponentTotal)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700 rounded-l-full"
              style={{ width: `${(myTotal / maxScore) * 50}%` }}
            />
            <div className="bg-slate-200 dark:bg-slate-800 flex-1 text-center" />
            <div
              className="bg-gradient-to-l from-rose-600 to-orange-500 transition-all duration-700 rounded-r-full"
              style={{ width: `${(opponentTotal / maxScore) * 50}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your Today</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatScore(myTodayScore)}</div>
          <div className="text-xs text-slate-500">{myTodayLogs.length} entries</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{opponent.username}&apos;s Today</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatScore(opponentTodayScore)}</div>
          <div className="text-xs text-slate-500">{opponentTodayLogs.length} entries</div>
        </div>
      </div>

      {/* Bet */}
      {match.bet && (
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider">🤝 The Bet (Idda)</div>
          <div className="text-sm text-slate-900 dark:text-white">"{match.bet.content}"</div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className={match.bet.challengerApproved ? 'text-emerald-400' : 'text-slate-500'}>
              {match.bet.challengerApproved ? '✓' : '○'} {match.challenger.username} approved
            </span>
            <span className={match.bet.opponentApproved ? 'text-emerald-400' : 'text-slate-500'}>
              {match.bet.opponentApproved ? '✓' : '○'} {match.opponent.username} approved
            </span>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Categories</div>
        <div className="flex flex-wrap gap-2">
          {match.categories.map((mc: { category: { name: string; weight: number; color: string } }, i: number) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: mc.category.color + '40', color: mc.category.color, backgroundColor: mc.category.color + '15' }}
            >
              {mc.category.name} ×{mc.category.weight}
            </span>
          ))}
        </div>
      </div>

      {/* Main content: log form + activity feeds */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Log activity */}
        {isActive && (
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Log Activity for this Match
            </h2>
            <ActivityForm matchId={id} onSuccess={() => mutate()} />
          </div>
        )}

        {/* Your logs */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-400" />
            Your Logs
          </h2>
          <LogList logs={myLogs} />
        </div>
      </div>

      {/* Opponent logs */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          {opponent.username}&apos;s Logs
        </h2>
        <LogList logs={opponentLogs} />
      </div>
    </div>
  )
}

type LogEntry = {
  id: string
  name: string
  durationMinutes: number
  score: number
  date: string
  loggedAt: string
  category: { name: string; weight: number; color: string }
}

function LogList({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">No entries yet.</div>
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-xl">
          <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: log.category.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{log.name}</div>
            <div className="text-xs text-slate-500">
              {formatDuration(log.durationMinutes)} · {log.category.name} · {log.date}
            </div>
          </div>
          <div className="text-sm font-bold text-violet-600 dark:text-violet-400">{formatScore(log.score)}</div>
        </div>
      ))}
    </div>
  )
}
