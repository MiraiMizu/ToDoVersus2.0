'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
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
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/matches', label: 'Matches', icon: Swords },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/achievements', label: 'Badges', icon: Medal },
  { href: '/profile', label: 'Profile', icon: User, dynamic: true },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useState(() => {
    setMounted(true)
  })

  const profileHref = session?.user?.id ? `/profile/${session.user.id}` : '/profile'

  return (
    <>
      {/* Top bar — always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-center px-4">
        <div className="w-full max-w-7xl flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-none mt-0.5">ToDoVersus</span>
          </Link>

        {/* Desktop nav links (hidden on mobile — we use bottom nav instead) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon, dynamic }) => {
            const resolvedHref = dynamic ? profileHref : href
            const isActive = pathname === resolvedHref || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={resolvedHref}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

          {/* User actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            )}

            {session?.user && (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mr-1">
                  <span className="text-slate-900 dark:text-white font-bold truncate max-w-[120px]">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  id="top-logout"
                  title="Sign out"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold border border-slate-200 dark:border-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed z-50 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-around px-4 rounded-3xl shadow-2xl shadow-black/10"
           style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))', left: '1.5rem', right: '1.5rem' }}>
        {navItems.map(({ href, label, icon: Icon, dynamic }) => {
          const resolvedHref = dynamic ? profileHref : href
          const isActive = pathname === resolvedHref || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={resolvedHref}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-violet-500/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
