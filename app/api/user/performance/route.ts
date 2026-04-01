import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  
  // Get date range for last 7 days
  const now = new Date()
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  try {
    // Fetch activities instead of dailyScore since dailyScore might not be consistently updated for all dates
    const activities = await prisma.activityLog.findMany({
      where: {
        userId,
        date: {
          in: dates
        }
      },
      select: {
        date: true,
        score: true,
        category: {
          select: {
            name: true,
            color: true
          }
        }
      }
    })

    // Group by date
    const performanceData = dates.map(date => {
      const dayActivities = activities.filter((a: any) => a.date === date)
      const totalScore = dayActivities.reduce((sum: number, a: any) => sum + a.score, 0)
      
      // Also group by category for summary
      const categories: Record<string, { name: string, value: number, color: string }> = {}
      dayActivities.forEach((a: any) => {
        if (!categories[a.category.name]) {
          categories[a.category.name] = { 
            name: a.category.name, 
            value: 0, 
            color: a.category.color 
          }
        }
        categories[a.category.name].value += a.score
      })

      return {
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        score: totalScore,
        categories: Object.values(categories)
      }
    })

    return NextResponse.json({ performanceData })
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
