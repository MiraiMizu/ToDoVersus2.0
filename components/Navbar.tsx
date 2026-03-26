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
} from 'lucide-react'

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
  const [menuOpen, setMenuOpen] = useState(false)

  const profileHref = session?.user?.id ? `/profile/${session.user.id}` : '/profile'

  return (
    <>
      {/* Top bar — always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">ToDoVersus</span>
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
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User actions */}
        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <span className="text-white font-medium">{session.user.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              id="top-logout"
              title="Sign out"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        )}
      </header>

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/60 flex items-center justify-around px-2">
        {navItems.map(({ href, label, icon: Icon, dynamic }) => {
          const resolvedHref = dynamic ? profileHref : href
          const isActive = pathname === resolvedHref || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={resolvedHref}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                isActive ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-violet-500/20' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
