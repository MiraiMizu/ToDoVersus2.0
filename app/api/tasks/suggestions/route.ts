import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get more past tasks and activity logs to deduplicate in memory (safer for D1/SQLite)
    const [matchTasks, activityLogs] = await Promise.all([
      prisma.matchTask.findMany({
        where: { user: { id: session.user.id } },
        select: { content: true, categoryId: true },
        take: 100, // Fetch more to allow for duplicates
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activityLog.findMany({
        where: { user: { id: session.user.id } },
        select: { name: true, categoryId: true },
        take: 100,
        orderBy: { loggedAt: 'desc' }
      })
    ])

    // Merge and format
    const formattedMatchTasks = matchTasks.map((t: { content: string; categoryId: string }) => ({ content: t.content, categoryId: t.categoryId }))
    const formattedLogs = activityLogs.map((l: { name: string; categoryId: string }) => ({ content: l.name, categoryId: l.categoryId }))

    // Deduplicate by content
    const seen = new Set<string>()
    const suggestions = [...formattedMatchTasks, ...formattedLogs].filter(s => {
      const content = s.content.trim()
      if (!content || seen.has(content.toLowerCase())) return false
      seen.add(content.toLowerCase())
      return true
    }).slice(0, 10)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Task suggestions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
