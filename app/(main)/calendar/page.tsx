'use client'

import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Calendar as CalendarIcon } from 'lucide-react'
import CalendarView from '@/components/CalendarView'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CalendarPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data: activitiesData } = useSWR(userId ? `/api/activities?userId=${userId}` : null, fetcher)
  const activities = activitiesData?.activities || []

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fadeInUp">
       <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/10 rounded-xl flex items-center justify-center">
             <CalendarIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Calendar</h1>
            <p className="text-sm text-slate-500">Track your daily consistency and view historical stats.</p>
          </div>
       </div>

       <div className="glass flex flex-col items-center rounded-3xl p-6">
          <CalendarView activities={activities} />
       </div>
    </div>
  )
}
