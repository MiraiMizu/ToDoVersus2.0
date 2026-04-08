export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { matches, matchTasks as matchTasksSchema } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getServerSession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, matchTasks } = body // action: 'accept' | 'decline', matchTasks: opponent's task list

    const db = getDb()
    const matchBaseList = await db.select().from(matches).where(eq(matches.id, id))
    const match = matchBaseList[0]
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.opponentId !== session.user.id) {
      return NextResponse.json({ error: 'Only the opponent can respond' }, { status: 403 })
    }

    if (match.status !== 'PENDING') {
      return NextResponse.json({ error: 'Match is not in PENDING state' }, { status: 400 })
    }

    if (action === 'accept') {
      // Validate opponent's tasks
      if (!matchTasks || matchTasks.length === 0) {
        return NextResponse.json({ error: 'You must select at least 1 task to accept the challenge' }, { status: 400 })
      }
      if (matchTasks.length > 5) {
        return NextResponse.json({ error: 'Maximum 5 tasks allowed' }, { status: 400 })
      }
      for (const mt of matchTasks) {
        if (!mt.content || !mt.categoryId) {
          return NextResponse.json({ error: 'All tasks must have content and a category' }, { status: 400 })
        }
      }

      const now = new Date()
      const endDate = new Date(now.getTime() + match.durationHours * 60 * 60 * 1000)

      // Add opponent's tasks and activate the match atomically
      const tasksToInsert = matchTasks.map((t: { content: string; categoryId: string }) => ({
        matchId: id,
        userId: session.user!.id,
        content: t.content,
        categoryId: t.categoryId,
      }))
      
      await db.insert(matchTasksSchema).values(tasksToInsert)
      await db.update(matches).set({
        status: 'ACTIVE',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
      }).where(eq(matches.id, id))
      
    } else {
      // Decline
      await db.update(matches).set({ status: 'DECLINED' }).where(eq(matches.id, id))
    }

    const updatedMatch = await db.query.matches.findFirst({
      where: eq(matches.id, id),
      with: {
        challenger: { columns: { id: true, username: true, avatarUrl: true } },
        opponent: { columns: { id: true, username: true, avatarUrl: true } },
        matchTasks: { with: { category: true } },
      },
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error('Respond to match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
