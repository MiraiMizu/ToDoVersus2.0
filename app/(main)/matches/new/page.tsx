'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Search, Swords, X, Plus, AlertCircle, LayoutDashboard, Trash2 } from 'lucide-react'
import { formatScore } from '@/lib/scoring'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function NewMatchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string; rank: string; allTimeScore: number } | null>(null)
  
  // Replace simple categories with a complex task list
  const [matchTasks, setMatchTasks] = useState<{ content: string; categoryId: string }[]>([{ content: '', categoryId: '' }])
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

  const updateTask = (index: number, field: 'content' | 'categoryId', value: string) => {
    const newTasks = [...matchTasks]
    if (newTasks[index]) {
       newTasks[index] = { ...newTasks[index], [field]: value }
       setMatchTasks(newTasks)
    }
  }

  const removeTask = (index: number) => {
    setMatchTasks(matchTasks.filter((_, i) => i !== index))
  }

  const addTask = () => {
    if (matchTasks.length < 5) {
      setMatchTasks([...matchTasks, { content: '', categoryId: '' }])
    }
  }

  const handleCreate = async () => {
    if (!selectedUser) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentId: selectedUser.id,
        matchTasks,
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

  const isValid = selectedUser && matchTasks.length > 0 && matchTasks.every(t => t.content.trim() !== '' && t.categoryId !== '')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fadeInUp">
      <div className="mb-6">
        <Link href="/matches" id="back-to-matches" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition mb-2">
          <LayoutDashboard className="w-3.5 h-3.5" /> Matches
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Swords className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          Challenge Someone
        </h1>
        <p className="text-slate-500 text-sm mt-1">Set up a competitive match against another user</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Step 1: Pick opponent */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-600 dark:bg-violet-500 rounded-full text-[10px] flex items-center text-white justify-center font-bold">1</span>
            Choose Opponent
          </h2>

          {selectedUser ? (
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {selectedUser.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedUser.username}</div>
                <div className="text-xs text-slate-500">{selectedUser.rank}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-red-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="opponent-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition shadow-sm"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl">
                  {searchResults.map((u: { id: string; username: string; rank: string; allTimeScore: number }) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setQuery('') }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white transition-colors">{u.username}</div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{u.rank} · {formatScore(u.allTimeScore)} pts</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Custom Tasks */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
             <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
               <span className="w-5 h-5 bg-violet-600 dark:bg-violet-500 rounded-full text-[10px] flex items-center text-white justify-center font-bold">2</span>
               Define Battle Tasks
             </h2>
             <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{matchTasks.length}/5 Tasks</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 ml-7">Determine up to 5 specific goals for this match.</p>
          
          <div className="space-y-3">
             {matchTasks.map((task, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-2 pl-3 rounded-xl border border-slate-200 dark:border-slate-800 group transition">
                   <div className="font-bold text-slate-300 dark:text-slate-600 w-4">{idx + 1}.</div>
                   <input 
                      type="text" 
                      placeholder="e.g. Read 20 pages"
                      value={task.content}
                      onChange={(e) => updateTask(idx, 'content', e.target.value)}
                      className="flex-1 w-full bg-slate-100/50 dark:bg-slate-800/30 border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0"
                   />
                   <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <select 
                         value={task.categoryId} 
                         onChange={(e) => updateTask(idx, 'categoryId', e.target.value)}
                         className="flex-1 sm:w-[130px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500 transition"
                      >
                         <option value="" disabled>Type</option>
                         {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id} className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">{cat.name} (x{cat.weight})</option>
                         ))}
                      </select>
                      {matchTasks.length > 1 && (
                         <button onClick={() => removeTask(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition shrink-0">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      )}
                   </div>
                </div>
             ))}
             
             {matchTasks.length < 5 && (
                <button 
                  onClick={addTask}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-slate-900 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                   <Plus className="w-4 h-4" /> Add Task
                </button>
             )}
          </div>
        </div>

        {/* Step 3: Bet */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-600 dark:bg-violet-500 rounded-full text-[10px] flex text-white items-center justify-center font-bold">3</span>
            Bet / Idda <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">(optional)</span>
          </h2>
          <textarea
            id="bet-content"
            value={betContent}
            onChange={(e) => setBetContent(e.target.value)}
            placeholder="e.g. Winner gets to pick the restaurant next time 🍕"
            rows={2}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none shadow-sm"
          />
        </div>

        {/* Submit */}
        <button
          id="create-match-submit"
          onClick={handleCreate}
          disabled={loading || !isValid}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-md"
        >
          <Swords className="w-5 h-5" />
          {loading ? 'Sending Ravens...' : 'Confirm Challenge'}
        </button>
      </div>
    </div>
  )
}
