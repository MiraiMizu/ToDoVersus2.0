'use client'

import React, { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'


interface CategoryData {
  name: string
  value: number
  color: string
}

export default function ActivitySummaryChart({ data }: { data: CategoryData[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass border border-slate-200 dark:border-slate-700 p-3 rounded-2xl shadow-xl backdrop-blur-md">
           <div className="flex items-center gap-1.5 mb-1">
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
             <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{data.name}</span>
           </div>
           <div className="text-lg font-black text-violet-600 dark:text-violet-400">
             {Math.round((data.value / total) * 100)}%
             <span className="text-xs font-normal text-slate-500 ml-1">· {data.value} pts</span>
           </div>
        </div>
      )
    }
    return null
  }

  return (
    <div 
      className="glass rounded-[2rem] p-6 md:p-8 h-[340px] flex flex-col mt-6 animate-fadeInUp"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Activity Split</h2>
          <div className="text-2xl font-black text-slate-900 dark:text-white">Category Focus</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full h-full">
        {total === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
             <div className="text-slate-400 text-sm mb-2 opacity-50">No logs today</div>
             <div className="text-violet-500 animate-pulse font-medium text-xs">Waiting for your first focus...</div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{total}</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className={`transition-all duration-300 outline-none`}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                      style={{ 
                        filter: activeIndex === index ? `drop-shadow(0 0 12px ${entry.color}66)` : 'none',
                        cursor: 'pointer',
                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: '50% 50%'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
      
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          {data.map((cat, i) => (
             <div 
               key={i} 
               className={`flex items-center gap-1.5 transition-all cursor-default ${activeIndex === i ? 'scale-110' : activeIndex !== null ? 'opacity-40 grayscale-[0.4]' : ''}`}
               onMouseEnter={() => setActiveIndex(i)}
               onMouseLeave={() => setActiveIndex(null)}
             >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{cat.name}</span>
             </div>
          ))}
        </div>
      )}
    </div>
  )
}
