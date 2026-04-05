'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AlertCircle, CheckCircle, Clock, Zap, X } from 'lucide-react'
import { ScrollTimePicker } from '@/components/ScrollTimePicker'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function QuickLogModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { data: matchData } = useSWR(isOpen ? '/api/todo/active-tasks' : null, fetcher)
  const tasks = matchData?.matchTasks || []

  const [activeLoggingId, setActiveLoggingId] = useState<string | null>(null)
  const [hours, setHours] = useState<number | ''>(0)
  const [minutes, setMinutes] = useState<number | ''>(0)
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

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

      setSuccess(`✓ +${data.score} PTS Gained!`)
      setActiveLoggingId(null)
      setHours(0)
      setMinutes(0)
      
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-violet-500" /> Quick Log
          </h2>
          <p className="text-sm text-slate-500 mt-1">Log time for your active match tasks.</p>
        </div>

        {(error || success) && (
          <div className="mb-4 space-y-2">
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 text-red-500 text-xs font-bold px-4 py-3 rounded-xl animate-shake">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-4 py-3 rounded-xl">
                <CheckCircle className="w-4 h-4" /> {success}
              </div>
            )}
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No active match tasks right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <div key={task.id} className={`p-4 rounded-3xl border transition-all ${activeLoggingId === task.id ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-900/10' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{task.content}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-500" style={{ color: task.category.color }}>
                      {task.category.name}
                    </span>
                  </div>
                  {activeLoggingId !== task.id && (
                    <button 
                      onClick={() => {
                        setActiveLoggingId(task.id)
                        setHours(0)
                        setMinutes(0)
                        setShowPicker(true)
                      }}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:scale-105 transition-transform shadow-md"
                    >
                      Log Time
                    </button>
                  )}
                </div>

                {activeLoggingId === task.id && (
                   <div className="pt-3 border-t border-slate-200 dark:border-white/10 animate-in slide-in-from-top-2">
                     {showPicker ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-700 p-2 mb-4">
                          <ScrollTimePicker
                            initialHours={Number(hours) || 0}
                            initialMinutes={Number(minutes) || 0}
                            onChange={(h, m) => {
                              setHours(h)
                              setMinutes(m)
                            }}
                            onClose={() => setShowPicker(false)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 mb-4">
                          <button
                            onClick={() => setShowPicker(true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          >
                            <Clock className="w-4 h-4" />
                            <span className="font-bold text-sm">
                              {hours || 0}h {minutes || 0}m
                            </span>
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                         <button
                           onClick={() => handleLogTask(task)}
                           disabled={loading === task.id}
                           className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
                         >
                           {loading === task.id ? 'Logging...' : 'Submit Log'}
                         </button>
                         <button
                           onClick={() => setActiveLoggingId(null)}
                           className="px-4 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-sm hover:opacity-80"
                         >
                           Cancel
                         </button>
                      </div>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
