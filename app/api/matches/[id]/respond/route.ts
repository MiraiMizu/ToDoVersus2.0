import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const match = await prisma.match.findUnique({ where: { id } })
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
      await prisma.$transaction([
        // Create opponent's tasks
        prisma.matchTask.createMany({
          data: matchTasks.map((t: { content: string; categoryId: string }) => ({
            matchId: id,
            userId: session.user!.id,
            content: t.content,
            categoryId: t.categoryId,
          })),
        }),
        // Activate the match with start/end dates
        prisma.match.update({
          where: { id },
          data: {
            status: 'ACTIVE',
            startDate: now,
            endDate,
          },
        }),
      ])
    } else {
      // Decline
      await prisma.match.update({
        where: { id },
        data: { status: 'DECLINED' },
      })
    }

    const updatedMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, username: true, avatarUrl: true } },
        opponent: { select: { id: true, username: true, avatarUrl: true } },
        matchTasks: { include: { category: true } },
      },
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error('Respond to match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
