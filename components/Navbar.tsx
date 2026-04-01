'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import useSWR from 'swr'
import {
  Zap,
  LayoutDashboard,
  Swords,
  Trophy,
  User,
  LogOut,
  Medal,
  Sun,
  Moon,
  Bell
} from 'lucide-react'
import { useTheme } from 'next-themes'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: Swords },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/achievements', label: 'Badges', icon: Medal },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const { data: notifData } = useSWR(session?.user?.id ? '/api/user/notifications' : null, fetcher, { refreshInterval: 60000 })
  const pendingCount = notifData?.notifications?.pendingMatches || 0

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const profileHref = session?.user?.id ? `/profile/${session.user.id}` : '/profile'
  const isProfileActive = pathname.startsWith('/profile')

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 pointer-events-none w-full max-w-fit flex justify-center">
      <div className="flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 p-1.5 sm:p-2 rounded-[2.5rem] shadow-2xl shadow-black/20 pointer-events-auto transition-all animate-fadeIn">
        
        {/* Brand / Logo */}
        <Link href="/dashboard" className="hidden sm:flex items-center justify-center w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[1.2rem] md:rounded-[1.5rem] shadow-lg shadow-violet-500/20 active:scale-95 transition-transform mr-1 md:mr-2">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {mainNavItems.map(({ href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            const showBadge = href === '/matches' && pendingCount > 0
            
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center justify-center w-10 md:w-12 h-10 md:h-12 rounded-[1.2rem] md:rounded-[1.5rem] transition-all duration-300 ${
                  isActive ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 md:w-5.5 md:h-5.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                
                {showBadge && (
                   <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse-glow" />
                )}

                {isActive && (
                  <span className="absolute -top-3 px-2 py-0.5 bg-violet-600 text-[10px] text-white font-bold rounded-full scale-0 group-hover:scale-100 transition-all duration-200 origin-bottom translate-y-[-100%] pointer-events-none whitespace-nowrap shadow-xl">
                    {href.slice(1).toUpperCase()}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Profile link */}
          <Link
            href={profileHref}
            className={`flex items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all duration-300 ${
              isProfileActive ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className={`w-5.5 h-5.5 ${isProfileActive ? 'scale-110' : ''}`} />
          </Link>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Utility buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="w-12 h-12 flex items-center justify-center rounded-[1.5rem] text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                id="bottom-logout"
                title="Sign out"
                className="w-12 h-12 flex items-center justify-center rounded-[1.5rem] text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
