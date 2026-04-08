export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matchTasks as matchTasksSchema, activityLogs as activityLogsSchema } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get more past tasks and activity logs to deduplicate in memory (safer for D1/SQLite)
    const db = getDb()
    const [matchTasks, activityLogs] = await Promise.all([
      db.query.matchTasks.findMany({
        where: eq(matchTasksSchema.userId, session.user.id),
        columns: { content: true, categoryId: true },
        limit: 100,
        orderBy: (tasks: any, { desc }: any) => [desc(tasks.createdAt)]
      }),
      db.query.activityLogs.findMany({
        where: eq(activityLogsSchema.userId, session.user.id),
        columns: { name: true, categoryId: true },
        limit: 100,
        orderBy: (logs: any, { desc }: any) => [desc(logs.loggedAt)]
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
