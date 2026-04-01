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
  CheckSquare,
  Users
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: Swords },
  { href: '/todo', label: 'Tasks', icon: CheckSquare },
  { href: '/social', label: 'Social', icon: Users },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
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
      <div className="flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 p-2 sm:p-2.5 rounded-[2.5rem] shadow-2xl shadow-black/20 pointer-events-auto transition-all animate-fadeIn">
        
        {/* Brand / Logo */}
        <Link href="/dashboard" className="hidden sm:flex items-center justify-center w-11 md:w-12 h-11 md:h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full shadow-lg shadow-violet-500/20 active:scale-95 transition-transform mr-1 md:mr-3">
          <Zap className="w-5 h-5 text-white" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {mainNavItems.map(({ href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            const showBadge = href === '/matches' && pendingCount > 0
            
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center justify-center w-11 md:w-12 h-11 md:h-12 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-[22px] h-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                
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
            className={`flex items-center justify-center w-11 md:w-12 h-11 md:h-12 rounded-full transition-all duration-300 ${
              isProfileActive ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className={`w-[22px] h-[22px] ${isProfileActive ? 'scale-110' : ''}`} />
          </Link>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2" />

          {/* Utility buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">

            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                id="bottom-logout"
                title="Sign out"
                className="w-11 md:w-12 h-11 md:h-12 flex items-center justify-center rounded-full text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all mr-0.5 sm:mr-0"
              >
                <LogOut className="w-[22px] h-[22px]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
