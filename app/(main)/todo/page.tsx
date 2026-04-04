'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AlertCircle, CheckCircle, Clock, LayoutDashboard, Zap, Target, ScrollText } from 'lucide-react'
import PersonalTodos from '@/components/PersonalTodos'
import { ScrollTimePicker } from '@/components/ScrollTimePicker'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: task.content, 
          categoryId: task.categoryId, 
          hours: h, 
          minutes: m, 
          matchId: task.matchId,
          matchTaskId: task.id
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log')

      setSuccess(`✓ BATTLE PROGRESS LOGGED! +${data.score} PTS Gained!`)
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
    <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto space-y-12 animate-fadeInUp mb-32 md:mb-10">
      
      {/* Header Section */}
      <div className="flex flex-col mb-4 mt-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-violet-500 transition-all mb-4 bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5 w-fit">
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
          Tasks <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600 dark:from-emerald-400 dark:to-indigo-400">🛡️</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-500" />
          Match tasks &amp; personal goals
        </p>
      </div>

      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-black uppercase tracking-widest px-6 py-4 rounded-2xl animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-black uppercase tracking-widest px-6 py-4 rounded-2xl animate-fadeInUp">
              <Zap className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10 items-start">
        
        {/* Match Objectives Section (Left/Major) */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
           <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="p-2.5 bg-violet-600/10 rounded-xl">
                <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Match Tasks</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Directly improves your match score</p>
              </div>
           </div>
          
          {tasks.length === 0 ? (
             <div className="glass rounded-2xl p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Active Match Tasks</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">Start a match to see your opponent's tasks here. Every minute you log counts towards your score.</p>
                <Link href="/matches/new" className="mt-6 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:scale-[1.02] transition-all shadow-lg">
                  Start a Match
                </Link>
             </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {tasks.map((task: any) => (
                <motion.div 
                  layout
                  key={task.id} 
                  className={`glass rounded-[2.5rem] p-8 border border-white/40 dark:border-white/5 transition-all duration-500 flex flex-col group hover:shadow-2xl hover:shadow-violet-500/5 ${activeLoggingId === task.id ? 'bg-white/80 dark:bg-slate-900/80 ring-2 ring-violet-500/20' : 'bg-white/40 dark:bg-slate-900/40'}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-violet-600/10 rounded-2xl flex items-center justify-center shrink-0">
                           <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                         </div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                           {task.content}
                         </h3>
                      </div>
                      <div className="flex items-center gap-3 pl-1">
                         <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: task.category.color }} />
                         <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 dark:text-slate-400">
                           {task.category.name} <span className="text-violet-500">· {task.category.weight}X SCORE</span>
                         </span>
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.3em] font-black text-violet-600 dark:text-violet-400 mt-2 bg-violet-500/10 w-fit px-3 py-1 rounded-full border border-violet-500/10">
                        VS. {task.matchOpponent}
                      </div>
                    </div>
                  </div>

                  {/* Logging Form (Toggled) */}
                  {activeLoggingId === task.id ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 border-t border-slate-100 dark:border-white/5 pt-5 space-y-4"
                    >
                      <div className="space-y-3">
                        <span className="text-xs font-medium text-slate-500 ml-1">Time Spent</span>
                        
                        <div className="relative group/picker">
                          {showPicker ? (
                            <div className="animate-fadeIn">
                              <ScrollTimePicker
                                initialHours={Number(hours) || 0}
                                initialMinutes={Number(minutes) || 0}
                                onChange={(h, m) => { setHours(h); setMinutes(m) }}
                                onClose={() => setShowPicker(false)}
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowPicker(true)}
                              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white transition hover:border-violet-500/50"
                            >
                              <span>
                                {(hours || hours === 0) && (minutes || minutes === 0) 
                                  ? `${hours}h ${minutes}m` 
                                  : 'Select duration...'}
                              </span>
                              <Clock className="w-5 h-5 text-violet-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                         <button
                           onClick={() => setActiveLoggingId(null)}
                           className="flex-1 py-3 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                         >
                           Cancel
                         </button>
                         <button
                           onClick={() => handleLogTask(task)}
                           disabled={loading === task.id || (Number(hours) === 0 && Number(minutes) === 0)}
                           className="flex-1 py-3 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/25"
                         >
                           {loading === task.id ? 'Saving...' : 'Log Progress'}
                         </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveLoggingId(task.id)
                        setHours(0)
                        setMinutes(0)
                        setShowPicker(false)
                      }}
                      className="mt-4 w-full py-3 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.01] transition-all shadow-md"
                    >
                      Log Time
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Personal TODOs (Right/Minor) */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
           <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="p-2.5 bg-emerald-600/10 rounded-xl">
                <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Personal Goals</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily tasks &amp; habits</p>
              </div>
           </div>
           
           <div className="glass rounded-2xl p-5 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 shadow-lg">
              <PersonalTodos />
           </div>
        </div>

      </div>
      
      {/* Footer Visual Filler */}
      <div className="h-20" />
    </div>
  )
}
