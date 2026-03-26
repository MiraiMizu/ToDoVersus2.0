'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Swords, Plus, ChevronRight, Clock, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ACTIVE: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  COMPLETED: { label: 'Completed', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  DECLINED: { label: 'Declined', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fadeInUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard" id="back-to-dashboard-matches" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Swords className="w-6 h-6 text-violet-400" />
            Matches
          </h1>
          <p className="text-slate-400 text-sm mt-1">{active.length} active battle{active.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/matches/new"
          id="new-match-btn"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          New Match
        </Link>
      </div>

      <div className="space-y-6">
        {/* Pending section */}
        {pending.length > 0 && (
          <Section title="Awaiting Response" icon={<Clock className="w-4 h-4 text-amber-400" />}>
            {pending.map((m: MatchItem) => (
              <MatchCard
                key={m.id}
                match={m}
                currentUserId={userId}
                onRespond={handleRespond}
              />
            ))}
          </Section>
        )}

        {/* Active */}
        {active.length > 0 && (
          <Section title="Active Battles" icon={<Swords className="w-4 h-4 text-emerald-400" />}>
            {active.map((m: MatchItem) => (
              <MatchCard key={m.id} match={m} currentUserId={userId} />
            ))}
          </Section>
        )}

        {/* History */}
        {completed.length > 0 && (
          <Section title="History" icon={<CheckCircle className="w-4 h-4 text-slate-400" />}>
            {completed.map((m: MatchItem) => (
              <MatchCard key={m.id} match={m} currentUserId={userId} />
            ))}
          </Section>
        )}

        {matches.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Swords className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No matches yet. Challenge someone to a battle!</p>
            <Link
              href="/matches/new"
              className="inline-flex items-center gap-2 mt-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Create Match
            </Link>
          </div>
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
  categories: { category: { name: string; weight: number; color: string } }[]
  bet?: { content: string; challengerApproved: boolean; opponentApproved: boolean } | null
  createdAt: string
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function MatchCard({
  match,
  currentUserId,
  onRespond,
}: {
  match: MatchItem
  currentUserId?: string
  onRespond?: (id: string, action: 'accept' | 'decline') => void
}) {
  const statusInfo = STATUS_STYLES[match.status] ?? STATUS_STYLES.PENDING
  const isChallenger = match.challengerId === currentUserId
  const opponent = isChallenger ? match.opponent : match.challenger
  const isPendingForMe = match.status === 'PENDING' && match.opponentId === currentUserId

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {opponent.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">
            vs <Link href={`/profile/${opponent.id}`} className="hover:text-violet-300 transition">{opponent.username}</Link>
          </div>
          <div className="text-xs text-slate-500">{opponent.rank}</div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {match.categories.map((mc, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-400"
            style={{ borderColor: mc.category.color + '40', color: mc.category.color }}
          >
            {mc.category.name}
          </span>
        ))}
      </div>

      {/* Bet */}
      {match.bet && (
        <div className="text-xs text-slate-500 mb-3 bg-slate-900/60 rounded-xl px-3 py-2">
          🤝 Bet: &quot;{match.bet.content}&quot;
          <span className="ml-2 text-emerald-400">{match.bet.challengerApproved ? '✓' : '○'}</span>
          <span className="ml-1 text-emerald-400">{match.bet.opponentApproved ? '✓' : '○'}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {match.status === 'ACTIVE' && (
          <Link
            href={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-xs font-semibold py-2 rounded-xl transition"
          >
            View Battle <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {isPendingForMe && onRespond && (
          <>
            <button
              id={`accept-match-${match.id}`}
              onClick={() => onRespond(match.id, 'accept')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold py-2 rounded-xl transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              id={`decline-match-${match.id}`}
              onClick={() => onRespond(match.id, 'decline')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold py-2 rounded-xl transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              Decline
            </button>
          </>
        )}

        {(match.status === 'COMPLETED' || match.status === 'DECLINED') && (
          <Link
            href={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs font-semibold py-2 rounded-xl transition"
          >
            View Summary <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {match.status === 'PENDING' && !isPendingForMe && (
          <div className="flex-1 text-center text-xs text-slate-500 py-2">Waiting for {opponent.username}...</div>
        )}
      </div>
    </div>
  )
}
