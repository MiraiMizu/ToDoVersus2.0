'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Search, Swords, X, Plus, AlertCircle, LayoutDashboard } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function NewMatchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string; rank: string } | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [betContent, setBetContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: searchData } = useSWR(
    query.length >= 2 ? `/api/users/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  )
  const { data: categoriesData } = useSWR('/api/categories', fetcher)
  const searchResults = searchData?.users ?? []
  const categories = categoriesData?.categories ?? []

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleCreate = async () => {
    if (!selectedUser || selectedCategories.length === 0) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentId: selectedUser.id,
        categoryIds: selectedCategories,
        betContent: betContent || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to create match')
      return
    }

    router.push('/matches')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fadeInUp">
      <div className="mb-6">
        <Link href="/matches" id="back-to-matches" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition mb-2">
          <LayoutDashboard className="w-3.5 h-3.5" /> Matches
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Swords className="w-6 h-6 text-violet-400" />
          Challenge Someone
        </h1>
        <p className="text-slate-400 text-sm mt-1">Set up a competitive match against another user</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Step 1: Pick opponent */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-500 rounded-full text-xs flex items-center justify-center font-bold">1</span>
            Choose Opponent
          </h2>

          {selectedUser ? (
            <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {selectedUser.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{selectedUser.username}</div>
                <div className="text-xs text-slate-500">{selectedUser.rank}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-red-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="opponent-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username..."
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden z-10 shadow-xl">
                  {searchResults.map((u: { id: string; username: string; rank: string; allTimeScore: number }) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setQuery('') }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition text-left"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{u.username}</div>
                        <div className="text-xs text-slate-500">{u.rank} · {u.allTimeScore} pts</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Categories */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-500 rounded-full text-xs flex items-center justify-center font-bold">2</span>
            Select Categories
            <span className="text-xs text-slate-500 font-normal ml-auto">{selectedCategories.length}/5 selected</span>
          </h2>
          <p className="text-xs text-slate-500 mb-3">Choose up to 5 categories to compete in</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: { id: string; name: string; weight: number; color: string; description?: string }) => {
              const isSelected = selectedCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  id={`match-category-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/20'
                      : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                    {isSelected && <span className="ml-auto text-xs text-violet-400">✓</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">×{cat.weight} weight · {cat.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 3: Bet */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-500 rounded-full text-xs flex items-center justify-center font-bold">3</span>
            Bet / Idda <span className="text-slate-500 font-normal text-xs">(optional)</span>
          </h2>
          <textarea
            id="bet-content"
            value={betContent}
            onChange={(e) => setBetContent(e.target.value)}
            placeholder="e.g. Winner gets to pick the restaurant next time 🍕"
            rows={2}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none"
          />
        </div>

        {/* Submit */}
        <button
          id="create-match-submit"
          onClick={handleCreate}
          disabled={loading || !selectedUser || selectedCategories.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
        >
          <Swords className="w-4 h-4" />
          {loading ? 'Creating Match...' : 'Send Challenge'}
        </button>
      </div>
    </div>
  )
}
