'use client'
export const runtime = 'edge';

import useSWR from 'swr'
import Link from 'next/link'
import { Shield, Users, Activity, PartyPopper, LayoutDashboard, Search, Zap, Clock, SmilePlus } from 'lucide-react'
import { useState } from 'react'
import { formatScore } from '@/lib/scoring'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const rankColors: Record<string, string> = {
  Bronze: '#d97706',
  Silver: '#9ca3af',
  Gold: '#eab308',
  Platinum: '#8b5cf6',
  Diamond: '#3b82f6',
  Master: '#ef4444'
}

export default function SocialPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [query, setQuery] = useState('')
  const { data, isLoading: friendsLoading } = useSWR('/api/social/friends', fetcher)
  const { data: feedRes, isLoading: feedLoading, mutate: mutateFeed } = useSWR('/api/social/feed', fetcher)
  const { data: searchData } = useSWR(query.length >= 2 ? `/api/users/search?q=${encodeURIComponent(query)}` : null, fetcher)
  
  const friends = data?.friends || []
  const feed = feedRes?.feed || []
  const searchResults = searchData?.users || []

  const handleReact = async (logId: string, emoji: string) => {
    if (!userId) return

    mutateFeed((currentData: any) => {
      if (!currentData) return currentData
      const newFeed = currentData.feed.map((log: any) => {
        if (log.id === logId) {
          const reactions = [...(log.reactions || [])]
          const existingIdx = reactions.findIndex(r => r.userId === userId && r.emoji === emoji)
          if (existingIdx !== -1) {
            reactions.splice(existingIdx, 1)
          } else {
            reactions.push({ userId, emoji, activityLogId: logId })
          }
          return { ...log, reactions }
        }
        return log
      })
      return { ...currentData, feed: newFeed }
    }, false)

    await fetch(`/api/social/feed/${logId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    })
    mutateFeed()
  }

  if (friendsLoading || feedLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Rivals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fadeInUp mb-24 md:mb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 mt-4">
        <div className="flex-1">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-violet-500 transition-all mb-4 bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
            Friends <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">🌐</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            {friends.length} {friends.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>
        <div className="relative w-full md:w-64 z-20">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition shadow-sm"
            />
          </div>

          {query.length >= 2 && (
            <div
              className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-slideDown"
            >
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No users found</div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                       {user.username.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.username}</div>
                       <div className="text-[10px] text-slate-500">{user.rank}</div>
                     </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex justify-center items-center mb-5 shadow-inner">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No connections yet</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed px-6">Challenge rivals to build your network. Every match creates a connection.</p>
            <Link href="/matches/new" className="mt-6 text-sm font-semibold text-white bg-violet-600 px-6 py-3 rounded-xl shadow-lg hover:bg-violet-500 transition-all">
              Challenge Someone
            </Link>
          </div>
        )}

        {friends.map((friendObj: any) => {
          const user = friendObj.user
          const c = rankColors[user.rank] || '#8b5cf6'

          return (
            <div
              key={user.id}
              className="animate-fadeInUp"
            >
              <Link 
                href={`/profile/${user.id}`}
                className="glass rounded-[3rem] p-8 group transition-all duration-700 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:border-violet-500/40 relative overflow-hidden flex flex-col items-center text-center bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-white/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div 
                  className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black text-white mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 border-4 border-white/20"
                  style={{ background: `linear-gradient(135deg, ${c}, #6366f1)` }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">{user.username}</h3>
                <div 
                  className="inline-flex items-center gap-2 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm"
                  style={{ backgroundColor: `${c}15`, color: c, border: `1px solid ${c}30` }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {user.rank}
                </div>

                <div className="mt-10 w-full border-t border-slate-100 dark:border-white/5 pt-8">
                  {friendObj.matchStatus === 'ACTIVE' ? (
                    <div className="flex flex-col items-center bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[2rem] p-6 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                         <Activity className="w-4 h-4 animate-pulse" /> Live Pulse
                       </span>
                       <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                          {friendObj.todayScore} <span className="text-xs font-bold text-slate-400 uppercase ml-1">pts</span>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-6 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                         {friendObj.matchStatus === 'COMPLETED' ? <PartyPopper className="w-4 h-4 text-violet-500" /> : <Zap className="w-4 h-4 text-slate-400" />} 
                         {friendObj.matchStatus === 'COMPLETED' ? 'LEGACY STATUS' : 'DORMANT'}
                       </span>
                       <div className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl uppercase tracking-widest border border-slate-200 dark:border-white/5 shadow-sm">
                          {friendObj.matchStatus === 'COMPLETED' ? 'Combat Finished' : 'No Active Link'}
                       </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      <div className="mt-16 mb-8 border-t border-slate-200 dark:border-white/10 pt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-500" />
          Live Activity Feed
        </h2>
        
        {feed.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center border border-slate-200 dark:border-white/5">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">It's quiet here. Challenge someone or log an activity to start the feed!</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {feed.map((log: any) => {
               const dt = new Date(log.loggedAt)
               return (
                 <div key={log.id} className="glass rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex items-center gap-4 transition-all hover:bg-white/60 dark:hover:bg-slate-800/40">
                   <div 
                     className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0"
                     style={{ background: `linear-gradient(135deg, ${log.category.color}, #6366f1)` }}
                   >
                     {log.user.username.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-900 dark:text-white truncate">{log.user.username}</span>
                       <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline-block">({formatScore(log.user.allTimeScore)} pts)</span>
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                       Logged <span className="font-semibold text-slate-800 dark:text-slate-200">"{log.name}"</span>
                     </p>
                     <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(dt, { addSuffix: true })}</span>
                       <span className="flex items-center gap-1">• {log.category.name} ({log.durationMinutes}m)</span>
                     </div>
                   </div>
                   <div className="text-right shrink-0 flex flex-col items-end gap-2">
                     <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full font-black text-sm text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30">
                       +{log.score}
                     </span>
                     <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        {['🔥', '👍', '💪'].map(emoji => {
                          const count = log.reactions?.filter((r: any) => r.emoji === emoji).length || 0
                          const hasReacted = log.reactions?.some((r: any) => r.emoji === emoji && r.userId === userId)
                          
                          if (count === 0 && !hasReacted) {
                            return (
                              <button key={emoji} onClick={() => handleReact(log.id, emoji)} className="text-xs grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                {emoji}
                              </button>
                            )
                          }
                          
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReact(log.id, emoji)}
                              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition ${hasReacted ? 'bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                            >
                              <span>{emoji}</span>
                              <span className="font-bold">{count}</span>
                            </button>
                          )
                        })}
                     </div>
                   </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  )
}
