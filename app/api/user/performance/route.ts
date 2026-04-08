export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { activityLogs as acSchema } from '@/db/schema'
import { eq, and, inArray, gte } from 'drizzle-orm'
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
    const db = getDb()
    const activities = await db.query.activityLogs.findMany({
      where: and(
        eq(acSchema.userId, userId),
        inArray(acSchema.date, dates)
      ),
      columns: {
        date: true,
        score: true,
      },
      with: {
        category: {
          columns: {
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

    // Calculate monthly summary
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    const monthlyActivities = await db.query.activityLogs.findMany({
      where: and(
        eq(acSchema.userId, userId),
        gte(acSchema.date, startOfLastMonth)
      ),
      columns: {
        date: true,
        score: true
      }
    })

    let thisMonthScore = 0
    let lastMonthScore = 0

    monthlyActivities.forEach((a: any) => {
      if (a.date >= startOfThisMonth) {
        thisMonthScore += a.score
      } else if (a.date >= startOfLastMonth && a.date <= endOfLastMonth) {
        lastMonthScore += a.score
      }
    })

    return NextResponse.json({ 
      performanceData,
      monthlySummary: {
        thisMonthScore,
        lastMonthScore
      }
    })
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
