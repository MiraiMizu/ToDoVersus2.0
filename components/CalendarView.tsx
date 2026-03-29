'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarView({ activities }: { activities: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday
  const daysInMonth = lastDay.getDate()

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1))
  const handleToday = () => setCurrentDate(new Date())

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const scoreMap = activities.reduce((acc, a) => {
    const key = a.date
    if (!acc[key]) acc[key] = 0
    acc[key] += a.score
    return acc
  }, {} as Record<string, number>)

  const renderDays = () => {
    const blanks = Array.from({ length: startDayOfWeek }).map((_, i) => (
      <div key={`blank-${i}`} className="h-14 md:h-20" />
    ))

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = i + 1
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const score = scoreMap[dateString] || 0
      
      const isToday = dateString === new Date().toISOString().split('T')[0]

      let bgClass = "bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
      if (score > 0 && score < 100) bgClass = "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
      if (score >= 100 && score < 500) bgClass = "bg-violet-200 dark:bg-violet-800/50 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700"
      if (score >= 500) bgClass = "bg-violet-500 dark:bg-violet-600 text-white border-violet-600 dark:border-violet-500 shadow-md shadow-violet-500/20"

      return (
        <div 
          key={d} 
          className={`h-14 md:h-20 flex flex-col items-center justify-center rounded-xl md:rounded-2xl border transition-all cursor-default ${bgClass} relative ${isToday ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
        >
          <span className={`text-sm md:text-base font-bold ${score >= 500 ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{d}</span>
          {score > 0 && <span className={`text-[10px] md:text-xs font-semibold opacity-90`}>{score}</span>}
        </div>
      )
    })

    return [...blanks, ...days]
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {monthNames[month]} <span className="text-slate-400 font-medium">{year}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition mr-2 hidden sm:block">
            Today
          </button>
          <button onClick={handlePrev} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
             <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <button onClick={handleNext} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
             <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-3 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {renderDays()}
      </div>
      
      <div className="flex items-center gap-3 md:gap-5 mt-8 justify-center flex-wrap text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" /> 0</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-md bg-violet-100 dark:bg-violet-900/30" /> 1-99</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-md bg-violet-200 dark:bg-violet-800/50" /> 100-499</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-md bg-violet-500 dark:bg-violet-600" /> 500+</div>
      </div>
    </div>
  )
}
