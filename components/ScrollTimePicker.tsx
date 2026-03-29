'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Check } from 'lucide-react'

interface ScrollTimePickerProps {
  initialHours?: number
  initialMinutes?: number
  onChange: (hours: number, minutes: number) => void
  onClose: () => void
}

export function ScrollTimePicker({
  initialHours = 0,
  initialMinutes = 0,
  onChange,
  onClose,
}: ScrollTimePickerProps) {
  const [hours, setHours] = useState(initialHours)
  const [minutes, setMinutes] = useState(initialMinutes)
  
  const ITEM_HEIGHT = 44 // Fixed height per item (h-11 = 44px)

  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)

  // Scroll handler that precisely computes the center element
  const handleScroll = (type: 'hours' | 'minutes') => (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const index = Math.round(el.scrollTop / ITEM_HEIGHT)
    
    // Bounds check
    const maxIndex = type === 'hours' ? 14 : 59
    const boundedIndex = Math.max(0, Math.min(index, maxIndex))
    
    if (type === 'hours') {
      if (hours !== boundedIndex) setHours(boundedIndex)
    } else {
      if (minutes !== boundedIndex) setMinutes(boundedIndex)
    }
  }

  // Effect to push changes upstream without creating infinite loops
  useEffect(() => {
    // We use a small timeout to avoid spamming the parent during fast scrolls
    const t = setTimeout(() => onChange(hours, minutes), 50)
    return () => clearTimeout(t)
  }, [hours, minutes, onChange])

  // Initial scroll to position strictly on mount
  useEffect(() => {
    if (hoursRef.current) hoursRef.current.scrollTop = initialHours * ITEM_HEIGHT
    if (minutesRef.current) minutesRef.current.scrollTop = initialMinutes * ITEM_HEIGHT
    // Disable detailed dependency array to intentionally only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl w-[260px] mx-auto animate-slideDown">
      <div className="flex justify-between items-center w-full mb-3 px-2">
        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Set Duration</span>
        <button 
          onClick={onClose} 
          className="bg-violet-500 hover:bg-violet-600 text-white w-7 h-7 rounded-full flex justify-center items-center transition"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>

      <div className="relative flex justify-center w-full h-[132px] overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
        
        {/* The highlight selector overlay */}
        <div className="pointer-events-none absolute top-[44px] w-full h-[44px] bg-slate-200/50 dark:bg-slate-800/50 border-y border-slate-300 dark:border-slate-700 z-10" />

        {/* --- HOURS --- */}
        <div 
          ref={hoursRef}
          onScroll={handleScroll('hours')}
          className="w-1/2 flex flex-col items-center h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar z-20 scroll-smooth"
        >
          <div style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={`h-${i}`} 
              className={`h-[44px] shrink-0 flex items-center justify-center snap-center text-lg font-bold transition-colors ${
                hours === i ? 'text-violet-600 dark:text-violet-400 scale-110' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {i}
              <span className="text-[10px] ml-1 font-normal opacity-50 uppercase tracking-widest">hr</span>
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />
        </div>

        {/* --- MINUTES --- */}
        <div 
          ref={minutesRef}
          onScroll={handleScroll('minutes')}
          className="w-1/2 flex flex-col items-center h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar z-20 bg-slate-100/30 dark:bg-slate-900/30 scroll-smooth"
        >
          <div style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />
          {Array.from({ length: 60 }).map((_, i) => (
            <div 
              key={`m-${i}`} 
              className={`h-[44px] shrink-0 flex items-center justify-center snap-center text-lg font-bold transition-colors ${
                minutes === i ? 'text-violet-600 dark:text-violet-400 scale-110' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {i.toString().padStart(2, '0')}
              <span className="text-[10px] ml-1 font-normal opacity-50 uppercase tracking-widest">m</span>
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
}
