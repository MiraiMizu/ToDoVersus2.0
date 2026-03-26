'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Clock, Zap, AlertCircle, CheckCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Predefined tasks per category name (matched by category name)
const PREDEFINED_TASKS: Record<string, string[]> = {
  'Important': ['Studying', 'Gym', 'Deep Work', 'Skill Learning', 'Reading Books'],
  'Less Important': ['Coding', 'Drawing', 'Side Projects', 'Planning', 'Networking'],
  'For Relaxing': ['Reading', 'Watching Content', 'Light Walk', 'Meditation', 'Journaling'],
}

interface ActivityFormProps {
  matchId?: string
  onSuccess?: (data: { score: number; newAchievements: string[] }) => void
}

export default function ActivityForm({ matchId, onSuccess }: ActivityFormProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [hours, setHours] = useState<number | ''>('')
  const [minutes, setMinutes] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: categoriesData } = useSWR('/api/categories', fetcher)
  const categories = categoriesData?.categories ?? []

  const selectedCategory = categories.find((c: { id: string }) => c.id === categoryId)
  const predefinedTasks = selectedCategory ? (PREDEFINED_TASKS[selectedCategory.name] ?? []) : []

  const previewScore = () => {
    const h = Number(hours) || 0
    const m = Number(minutes) || 0
    const totalMin = h * 60 + m
    const cat = categories.find((c: { id: string; weight: number }) => c.id === categoryId)
    if (!cat || totalMin <= 0) return null
    return totalMin * cat.weight
  }

  const score = previewScore()

  const handleHoursChange = (val: string) => {
    const n = val === '' ? '' : Math.max(0, Math.min(16, Number(val)))
    setHours(n)
  }

  const handleMinutesChange = (val: string) => {
    const n = val === '' ? '' : Math.max(0, Math.min(59, Number(val)))
    setMinutes(n)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const h = Number(hours) || 0
    const m = Number(minutes) || 0
    if (h === 0 && m === 0) {
      setError('Please enter a duration greater than 0.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, categoryId, hours: h, minutes: m, matchId }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to log activity')
      return
    }

    setSuccess(`✓ Logged! +${data.score} points${data.newAchievements?.length ? ` · 🏆 New badge!` : ''}`)
    setName('')
    setCategoryId('')
    setHours('')
    setMinutes('')
    onSuccess?.(data)

    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl animate-fadeInUp">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl animate-fadeInUp">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Category selector */}
      <div>
        <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat: { id: string; name: string; weight: number; color: string }) => (
            <button
              key={cat.id}
              type="button"
              id={`category-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => {
                setCategoryId(cat.id)
                setName('') // reset name when category changes
              }}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                categoryId === cat.id
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="font-semibold text-xs">{cat.name}</div>
              </div>
              <div className="text-[10px] opacity-70">×{cat.weight} pts/min</div>
            </button>
          ))}
        </div>
      </div>

      {/* Predefined task chips */}
      {predefinedTasks.length > 0 && (
        <div>
          <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Quick Select</label>
          <div className="flex flex-wrap gap-2">
            {predefinedTasks.map((task) => (
              <button
                key={task}
                type="button"
                onClick={() => setName(task)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  name === task
                    ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                {task}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity name */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Activity Name</label>
        <input
          id="activity-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={selectedCategory ? `e.g. ${predefinedTasks[0] ?? 'My Activity'}` : 'Select a category first'}
          required
          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">
          Duration
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="activity-hours"
              type="number"
              min={0}
              max={16}
              value={hours}
              onChange={(e) => handleHoursChange(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              style={{ fontSize: '16px' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">h</span>
          </div>
          <div className="relative flex-1">
            <input
              id="activity-minutes"
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
              style={{ fontSize: '16px' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">m</span>
          </div>
        </div>
      </div>

      {/* Score preview */}
      {score !== null && (
        <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 animate-fadeInUp">
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <Zap className="w-4 h-4" />
            Score Preview
          </div>
          <div className="text-lg font-bold text-violet-300">+{score} pts</div>
        </div>
      )}

      <button
        id="activity-submit"
        type="submit"
        disabled={loading || !name || !categoryId || (Number(hours) === 0 && Number(minutes) === 0)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            Log Activity
          </>
        )}
      </button>
    </form>
  )
}
