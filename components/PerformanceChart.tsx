'use client'

import React, { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'

interface PerformanceData {
  date: string
  day: string
  score: number
  categories: { name: string; value: number; color: string }[]
}

export default function PerformanceChart({ data }: { data: PerformanceData[] }) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      score: Math.round(d.score)
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload as PerformanceData
      return (
        <div className="glass !bg-white/90 dark:!bg-slate-900/90 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">{dayData.date}</div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
             <div className="text-lg font-black text-slate-900 dark:text-white">
               {dayData.score} <span className="text-xs font-normal text-slate-500">pts</span>
             </div>
          </div>
          
          {dayData.categories.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-2">
              {dayData.categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">+{cat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-[2rem] p-6 md:p-8 h-[340px] relative overflow-hidden mt-6"
    >
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Weekly Performance</h2>
          <div className="text-2xl font-black text-slate-900 dark:text-white">Trend Analysis</div>
        </div>
      </div>

      <div className="absolute inset-0 pt-20 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              vertical={false}
              horizontal={false} /* Removed dashed lines completely to look cleaner */
            />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 600 }}
              className="text-slate-400 dark:text-slate-500"
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 600 }}
              className="text-slate-400 dark:text-slate-500"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#7c3aed', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#7c3aed"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
              animationDuration={2000}
              activeDot={{ r: 6, strokeWidth: 0, className: "shadow-lg" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
