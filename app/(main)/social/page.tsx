'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Trophy, Shield, Flame, Activity, Users, PartyPopper } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Reuse rank colors
const rankColors: Record<string, string> = {
  Bronze: '#d97706',
  Silver: '#9ca3af',
  Gold: '#eab308',
  Platinum: '#8b5cf6',
  Diamond: '#3b82f6',
  Master: '#ef4444'
}

export default function SocialPage() {
  const { data, error, isLoading } = useSWR('/api/social/friends', fetcher)
  const friends = data?.friends || []

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fadeInUp mb-32 md:mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-violet-600 dark:text-violet-400" />
            Social
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">
            Keep track of your rivals and friends.
          </p>
        </div>
        <Link
          href="/matches/new"
          className="flex items-center justify-center bg-violet-100 hover:bg-violet-200 dark:bg-violet-500/20 dark:hover:bg-violet-500/30 text-violet-700 dark:text-violet-400 text-sm font-bold px-5 py-3 rounded-2xl transition-all active:scale-95 shrink-0"
        >
          Find New Rivals
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.length === 0 && !isLoading && (
          <div className="col-span-full glass rounded-[2rem] p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex justify-center items-center mb-6">
              <Users className="w-8 h-8 text-slate-400 opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nobody here yet!</h3>
            <p className="mt-2 text-sm max-w-sm mb-6">Challenge someone to a match. Once you duel, they become your friend automatically.</p>
            <Link href="/matches/new" className="text-sm font-bold text-white bg-violet-600 px-6 py-3 rounded-xl hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20">
              Start a Match
            </Link>
          </div>
        )}

        {friends.map((friendObj: any) => {
          const user = friendObj.user
          const c = rankColors[user.rank] || '#8b5cf6'

          return (
            <Link 
              key={user.id} 
              href={`/profile/${user.id}`}
              className="glass rounded-3xl p-6 group transition-all duration-300 hover:shadow-xl hover:border-violet-500/40 relative overflow-hidden flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ background: `linear-gradient(135deg, ${c}, #6366f1)` }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>

              {/* Name & Rank */}
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{user.username}</h3>
              <div 
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 mt-2 rounded-full"
                style={{ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30` }}
              >
                <Shield className="w-3.5 h-3.5" />
                {user.rank}
              </div>

              {/* Status Section */}
              <div className="mt-6 w-full border-t border-slate-200 dark:border-slate-800/60 pt-5">
                {friendObj.matchStatus === 'ACTIVE' ? (
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                       <Activity className="w-3 h-3" /> Today's Gain
                     </span>
                     <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {friendObj.todayScore} <span className="text-sm font-medium text-slate-500">pts</span>
                     </div>
                  </div>
                ) : friendObj.matchStatus === 'COMPLETED' ? (
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1">
                       <PartyPopper className="w-3 h-3" /> Match Status
                     </span>
                     <div className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl">
                        Match Finished
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                       Status
                     </span>
                     <div className="text-sm font-bold bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl">
                        Pending/No Match
                     </div>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
