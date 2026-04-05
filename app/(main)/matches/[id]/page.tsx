'use client'

import { use, useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatScore, formatDuration } from '@/lib/scoring'
import ActivityForm from '@/components/ActivityForm'
import { Swords, Trophy, Flame, Clock, LayoutDashboard, Plus, Trash2, Zap, Star, Leaf, CheckCircle, AlertCircle, Share2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORY_META: Record<string, { icon: React.ReactNode; pts: string }> = {
  Critical:  { icon: <Zap  className="w-3 h-3 text-violet-500" />, pts: '4 pts/min' },
  Important: { icon: <Star className="w-3 h-3 text-amber-500"  />, pts: '2 pts/min' },
  Relaxing:  { icon: <Leaf className="w-3 h-3 text-emerald-500" />, pts: '1 pt/min'  },
}

function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    if (!endDate) return
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Ended'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`)
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`)
      else setTimeLeft(`${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endDate])
  return timeLeft
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldAccept = searchParams.get('accept') === '1'
  const userId = session?.user?.id

  const { data, mutate } = useSWR(id ? `/api/matches/${id}` : null, fetcher, { refreshInterval: 30000 })
  const { data: categoriesData } = useSWR('/api/categories', fetcher)
  const match = data?.match
  const categories: { id: string; name: string; weight: number }[] = categoriesData?.categories ?? []

  // Opponent task selection state
  const [opponentTasks, setOpponentTasks] = useState<{ content: string; categoryId: string }[]>([{ content: '', categoryId: '' }])
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [acceptError, setAcceptError] = useState('')
  const [declineLoading, setDeclineLoading] = useState(false)

  const countdown = useCountdown(match?.endDate)
  const isForever = match?.durationHours >= 87600

  const { data: suggestionsData } = useSWR('/api/tasks/suggestions', fetcher)
  const suggestions: { content: string, categoryId: string }[] = suggestionsData?.suggestions ?? []
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null)

  if (!match) {
    return (
      <div className="p-6 text-center">
        <div className="text-slate-500">Loading match...</div>
      </div>
    )
  }

  const isChallenger = match.challengerId === userId
  const isOpponent = match.opponentId === userId
  const me = isChallenger ? match.challenger : match.opponent
  const opponent = isChallenger ? match.opponent : match.challenger

  // My tasks: tasks where userId === me.id
  const myTasks = match.matchTasks?.filter((t: any) => t.userId === userId) ?? []
  const opponentMatchTasks = match.matchTasks?.filter((t: any) => t.userId !== userId) ?? []

  // Scores from activity logs
  const myLogs = match.activityLogs?.filter((l: any) => l.userId === userId) ?? []
  const opponentLogs = match.activityLogs?.filter((l: any) => l.userId !== userId) ?? []
  const myTotal = myLogs.reduce((s: number, l: { score: number }) => s + l.score, 0)
  const opponentTotal = opponentLogs.reduce((s: number, l: { score: number }) => s + l.score, 0)
  const maxScore = Math.max(myTotal, opponentTotal, 1)

  const today = new Date().toISOString().split('T')[0]
  const myTodayScore = myLogs.filter((l: any) => l.date === today).reduce((s: number, l: { score: number }) => s + l.score, 0)
  const opponentTodayScore = opponentLogs.filter((l: any) => l.date === today).reduce((s: number, l: { score: number }) => s + l.score, 0)

  const isActive = match.status === 'ACTIVE'
  const isPending = match.status === 'PENDING'
  const isCompleted = match.status === 'COMPLETED' || match.status === 'DECLINED'
  const isPendingForMe = isPending && isOpponent

  // Lead indicator
  const leadDiff = myTotal - opponentTotal
  const leadLabel = leadDiff > 0 ? `You lead by ${formatScore(leadDiff)} pts` : leadDiff < 0 ? `${opponent.username} leads by ${formatScore(Math.abs(leadDiff))} pts` : 'Tied!'

  // Opponent task-selection handlers
  const updateOppTask = (i: number, field: 'content' | 'categoryId', val: string) => {
    const t = [...opponentTasks]; t[i] = { ...t[i], [field]: val }; setOpponentTasks(t)
  }
  const removeOppTask = (i: number) => setOpponentTasks(opponentTasks.filter((_, idx) => idx !== i))
  const addOppTask = () => { if (opponentTasks.length < 5) setOpponentTasks([...opponentTasks, { content: '', categoryId: '' }]) }

  const handleAccept = async () => {
    if (!opponentTasks.every(t => t.content.trim() && t.categoryId)) {
      setAcceptError('Please fill in all tasks before accepting.'); return
    }
    setAcceptLoading(true); setAcceptError('')
    const res = await fetch(`/api/matches/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', matchTasks: opponentTasks }),
    })
    const d = await res.json()
    setAcceptLoading(false)
    if (!res.ok) { setAcceptError(d.error || 'Failed to accept'); return }
    mutate()
    router.replace(`/matches/${id}`)
  }

  const handleDecline = async () => {
    setDeclineLoading(true)
    await fetch(`/api/matches/${id}/respond`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline' }),
    })
    setDeclineLoading(false)
    router.push('/matches')
  }

  // ------- opponent task selection screen -------
  if (isPendingForMe && (shouldAccept || true)) {
    return (
      <div className="max-w-2xl mx-auto animate-fadeInUp mb-24 md:mb-10">
        <Link href="/matches" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition mb-4">
          <LayoutDashboard className="w-3.5 h-3.5" /> Matches
        </Link>
        <div className="glass rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center text-base font-bold text-white">
              {match.challenger.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-xs text-slate-500">Challenge from</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{match.challenger.username}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-slate-500">Duration</div>
              <div className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {match.durationHours >= 87600 ? 'Forever' : match.durationHours >= 8760 ? '1 Year' : match.durationHours >= 168 ? '1 Week' : match.durationHours >= 72 ? '3 Days' : '1 Day'}
              </div>
            </div>
          </div>

          {/* Their tasks */}
          <div className="mb-4">
            <div className="text-xs font-medium text-slate-500 mb-2">{match.challenger.username}&apos;s Battle Tasks</div>
            <div className="space-y-2">
              {match.matchTasks?.filter((t: any) => t.userId === match.challengerId).map((t: any, i: number) => {
                const meta = CATEGORY_META[t.category?.name]
                return (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: t.category?.color }} />
                    <span className="text-sm text-slate-800 dark:text-slate-200 flex-1">{t.content}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      {meta?.icon} {t.category?.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {match.bet && (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 mb-4">
              🤝 Bet: &quot;{match.bet.content}&quot;
            </div>
          )}
        </div>

        {/* Opponent's task selection */}
        <div className="glass rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
            <Swords className="w-4 h-4 text-violet-500" />
            Your Battle Tasks
          </h2>
          <p className="text-xs text-slate-500 mb-4">Choose what <strong>you</strong> will work on for this duel. Pick 1–5 tasks.</p>

          {acceptError && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl mb-3">
              <AlertCircle className="w-3.5 h-3.5" /> {acceptError}
            </div>
          )}

          {/* Category legend */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {categories.map(cat => {
              const meta = CATEGORY_META[cat.name]
              if (!meta) return null
              return (
                <div key={cat.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center border border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-center gap-1 mb-0.5">{meta.icon}<span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span></div>
                  <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{meta.pts}</div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            {opponentTasks.map((task, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-2 pl-3 rounded-xl border border-slate-200 dark:border-slate-800 transition">
                  <div className="font-bold text-slate-300 dark:text-slate-600 w-4">{idx + 1}.</div>
                  <input
                    type="text"
                    placeholder="e.g. Study for exam"
                    value={task.content}
                    onFocus={() => setActiveSuggestionIdx(idx)}
                    onChange={e => updateOppTask(idx, 'content', e.target.value)}
                    className="flex-1 w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <select
                      value={task.categoryId}
                      onChange={e => updateOppTask(idx, 'categoryId', e.target.value)}
                      className="flex-1 sm:w-[150px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500 transition"
                    >
                      <option value="" disabled>Select type...</option>
                      {categories.map(cat => {
                        const m = CATEGORY_META[cat.name]
                        return <option key={cat.id} value={cat.id} className="bg-slate-50 dark:bg-slate-900">{cat.name} ({m?.pts ?? `x${cat.weight}`})</option>
                      })}
                    </select>
                    {opponentTasks.length > 1 && (
                      <button onClick={() => removeOppTask(idx)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick select suggestions */}
                {activeSuggestionIdx === idx && suggestions.length > 0 && !task.content && (
                   <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 animate-fadeIn">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Quick Select (Past Tasks)</div>
                      <div className="grid grid-cols-2 gap-1">
                         {suggestions.map((s, sIdx) => (
                            <button
                               key={sIdx}
                               onMouseDown={(e) => {
                                  e.preventDefault();
                                  updateOppTask(idx, 'content', s.content);
                                  updateOppTask(idx, 'categoryId', s.categoryId);
                                  setActiveSuggestionIdx(null);
                               }}
                               className="text-left px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg transition truncate"
                            >
                               {s.content}
                            </button>
                         ))}
                      </div>
                   </div>
                )}
                {activeSuggestionIdx === idx && (
                   <div className="fixed inset-0 z-10" onClick={() => setActiveSuggestionIdx(null)} />
                )}
              </div>
            ))}
            {opponentTasks.length < 5 && (
              <button onClick={addOppTask} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 hover:border-violet-300 rounded-xl text-sm transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={declineLoading}
            className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            {declineLoading ? 'Declining...' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            disabled={acceptLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-3.5 rounded-xl transition shadow-lg shadow-violet-600/25 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {acceptLoading ? 'Accepting...' : 'Accept & Start Duel'}
          </button>
        </div>
      </div>
    )
  }

  // ------- normal match view -------
  return (
    <div className="animate-fadeInUp space-y-6 mb-24 md:mb-10">
      <Link href="/matches" id="back-to-matches-detail" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition">
        <LayoutDashboard className="w-3.5 h-3.5" /> Matches
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isActive ? (isForever ? '⚔️ Battle in Progress (Forever)' : '⚔️ Battle in Progress') : isCompleted ? '🏆 Match Complete' : '⏳ Pending'}
          </div>
          <div className="flex items-center gap-3">
            {isActive && match.endDate && !isForever && (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                {countdown}
              </div>
            )}
            {isActive && isForever && (
              <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                No End Date
              </div>
            )}
            {match.winner && (
              <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                🥇 {match.winner.username} wins!
              </div>
            )}
            <button
               onClick={() => {
                  if (navigator.share) {
                     navigator.share({
                        title: `${match.challenger.username} vs ${match.opponent.username} | ToDoVersus`,
                        text: `Check out the battle results between ${match.challenger.username} and ${match.opponent.username}!`,
                        url: window.location.href
                     }).catch(() => {});
                  } else {
                     navigator.clipboard.writeText(window.location.href);
                     alert('Link copied to clipboard!');
                  }
               }}
               className="p-1.5 text-slate-400 hover:text-violet-400 transition hover:bg-slate-800 rounded-lg"
               title="Share Results"
            >
               <Share2 className="w-4 h-4" />
            </button>
          </div>
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
            {isActive && (
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                leadDiff > 0 ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                : leadDiff < 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 text-slate-500'
              }`}>
                {leadLabel}
              </div>
            )}
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
            <div className="bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-700 rounded-l-full" style={{ width: `${(myTotal / (myTotal + opponentTotal || 1)) * 100}%` }} />
            <div className="bg-gradient-to-l from-rose-600 to-orange-500 transition-all duration-700 rounded-r-full flex-1" />
          </div>
        </div>
      </div>

      {/* Today's scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your Today</div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatScore(myTodayScore)}</div>
          <div className="text-xs text-slate-500">{myLogs.filter((l: any) => l.date === today).length} entries</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{opponent.username}&apos;s Today</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatScore(opponentTodayScore)}</div>
          <div className="text-xs text-slate-500">{opponentLogs.filter((l: any) => l.date === today).length} entries</div>
        </div>
      </div>

      {/* Both players' tasks side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
              {me.username[0]?.toUpperCase()}
            </div>
            {me.username}&apos;s Tasks
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 ? <p className="text-xs text-slate-500 italic">No tasks yet</p> : myTasks.map((t: any, i: number) => {
              const meta = CATEGORY_META[t.category?.name]
              return (
                <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl">
                  <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: t.category?.color }} />
                  <span className="text-sm flex-1 text-slate-900 dark:text-white">{t.content}</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">{meta?.icon} {meta?.pts}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gradient-to-br from-rose-500 to-orange-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
              {opponent.username[0]?.toUpperCase()}
            </div>
            {opponent.username}&apos;s Tasks
          </div>
          <div className="space-y-2">
            {opponentMatchTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{isPending ? 'Waiting for opponent to accept...' : 'No tasks'}</p>
            ) : opponentMatchTasks.map((t: any, i: number) => {
              const meta = CATEGORY_META[t.category?.name]
              return (
                <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl">
                  <span className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: t.category?.color }} />
                  <span className="text-sm flex-1 text-slate-900 dark:text-white">{t.content}</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">{meta?.icon} {meta?.pts}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bet */}
      {match.bet && (
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium uppercase tracking-wider">🤝 The Bet (İddia)</div>
          <div className="text-sm text-slate-900 dark:text-white">&quot;{match.bet.content}&quot;</div>
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
