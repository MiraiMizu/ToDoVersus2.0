import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { challengerId: session.user.id },
          { opponentId: session.user.id },
        ],
      },
      include: {
        challenger: { select: { id: true, username: true, avatarUrl: true, rank: true } },
        opponent: { select: { id: true, username: true, avatarUrl: true, rank: true } },
        bet: true,
        categories: { include: { category: true } },
        matchTasks: { include: { category: true } },
        winner: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opponentId, matchTasks, betContent, durationHours = 24 } = body

    if (!opponentId || !matchTasks || matchTasks.length === 0) {
      return NextResponse.json({ error: 'Opponent and tasks are required' }, { status: 400 })
    }

    if (matchTasks.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 tasks allowed' }, { status: 400 })
    }

    for (const mt of matchTasks) {
       if (!mt.content || !mt.categoryId) return NextResponse.json({ error: 'All tasks must have content and category assigned' }, { status: 400 })
    }

    if (opponentId === session.user.id) {
      return NextResponse.json({ error: 'You cannot challenge yourself' }, { status: 400 })
    }

    const validDurations = [24, 72, 168] // 1 day, 3 days, 7 days
    const duration = validDurations.includes(Number(durationHours)) ? Number(durationHours) : 24

    const match = await prisma.match.create({
      data: {
        challengerId: session.user.id,
        opponentId,
        status: 'PENDING',
        durationHours: duration,
        // Challenger's tasks are stored with their userId
        matchTasks: {
          create: matchTasks.map((t: { content: string, categoryId: string }) => ({
             content: t.content,
             categoryId: t.categoryId,
             userId: session.user!.id,
          }))
        },
        bet: betContent
          ? {
              create: {
                content: betContent,
                challengerApproved: true,
              },
            }
          : undefined,
      },
      include: {
        challenger: { select: { id: true, username: true, avatarUrl: true } },
        opponent: { select: { id: true, username: true, avatarUrl: true } },
        matchTasks: { include: { category: true } },
        bet: true,
      },
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error('Create match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
