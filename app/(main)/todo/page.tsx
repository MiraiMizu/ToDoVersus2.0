'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AlertCircle, CheckCircle, Clock, Save, LogIn } from 'lucide-react'
import PersonalTodos from '@/components/PersonalTodos'
import { ScrollTimePicker } from '@/components/ScrollTimePicker'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function TodoPage() {
  const { data: matchData, mutate: mutateMatchTasks } = useSWR('/api/todo/active-tasks', fetcher)
  const tasks = matchData?.matchTasks || []

  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  // States for logging
  const [activeLoggingId, setActiveLoggingId] = useState<string | null>(null)
  const [hours, setHours] = useState<number | ''>(0)
  const [minutes, setMinutes] = useState<number | ''>(0)
  const [showPicker, setShowPicker] = useState(false)

  const handleLogTask = async (task: any) => {
    const h = Number(hours) || 0
    const m = Number(minutes) || 0

    if (h === 0 && m === 0) {
      setError('Please enter a duration greater than 0.')
      return
    }

    setLoading(task.id)
    setError('')
    setSuccess('')

    try {
      // Create an activity targeting this match task specifically
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: task.content, 
          categoryId: task.categoryId, 
          hours: h, 
          minutes: m, 
          matchId: task.matchId,
          matchTaskId: task.id // Optional enhancement
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log')

      setSuccess(`✓ Logged! +${data.score} points`)
      setActiveLoggingId(null)
      setHours(0)
      setMinutes(0)
      
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fadeInUp mb-32 md:mb-10">
      
      <div className="flex flex-col mb-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
          <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-violet-600 dark:text-violet-400" />
          Tasks & Logging
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">
          Log time for your Match Objectives or organize your personal daily focus.
        </p>
      </div>

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

      <div className="grid md:grid-cols-2 gap-8 items-start">
        
        {/* Match Tasks Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Match Objectives
          </h2>
          
          {tasks.length === 0 ? (
             <div className="glass rounded-[2rem] p-8 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                <CheckCircle className="w-10 h-10 text-slate-400 opacity-50 mb-4" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active match tasks right now.</p>
                <p className="text-xs text-slate-500 mt-2">Start a match to see your opponent's objectives here!</p>
             </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task: any) => (
                <div key={task.id} className="glass rounded-3xl p-5 border border-slate-200 dark:border-slate-700/50 hover:border-violet-500/30 transition-all flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {task.content}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color }} />
                         <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                           {task.category.name} ({task.category.weight}x PTS)
                         </span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                        vs. {task.matchOpponent}
                      </div>
                    </div>
                  </div>

                  {/* Logging Form (Toggled) */}
                  {activeLoggingId === task.id ? (
                    <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-5 animate-slideDown">
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Log Duration</label>
                        {showPicker ? (
                          <ScrollTimePicker
                            initialHours={Number(hours) || 0}
                            initialMinutes={Number(minutes) || 0}
                            onChange={(h, m) => { setHours(h); setMinutes(m) }}
                            onClose={() => setShowPicker(false)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowPicker(true)}
                            className="w-full flex items-center justify-between bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                          >
                            <span className="font-medium">
                              {(hours || hours === 0) && (minutes || minutes === 0) 
                                ? `${hours} hr ${minutes} min` 
                                : 'Select duration...'}
                            </span>
                            <Clock className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                        <div className="flex gap-2.5 mt-2">
                           <button
                             onClick={() => setActiveLoggingId(null)}
                             className="flex-1 py-3 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                           >
                             Cancel
                           </button>
                           <button
                             onClick={() => handleLogTask(task)}
                             disabled={loading === task.id || (Number(hours) === 0 && Number(minutes) === 0)}
                             className="flex-1 py-3 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-500/20"
                           >
                             {loading === task.id ? 'Logging...' : 'Confirm'}
                           </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveLoggingId(task.id)
                        setHours(0)
                        setMinutes(0)
                        setShowPicker(false)
                      }}
                      className="mt-4 w-full py-2.5 text-xs font-bold rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                    >
                      Log Time
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal TODOs */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             Personal To-Do
           </h2>
           <PersonalTodos />
        </div>

      </div>
    </div>
  )
}
