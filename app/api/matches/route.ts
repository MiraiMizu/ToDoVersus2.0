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
    const { opponentId, categoryIds, betContent } = body

    if (!opponentId || !categoryIds || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Opponent and categories are required' }, { status: 400 })
    }

    if (categoryIds.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 categories allowed' }, { status: 400 })
    }

    if (opponentId === session.user.id) {
      return NextResponse.json({ error: 'You cannot challenge yourself' }, { status: 400 })
    }

    const match = await prisma.match.create({
      data: {
        challengerId: session.user.id,
        opponentId,
        status: 'PENDING',
        categories: {
          create: categoryIds.map((categoryId: string) => ({ categoryId })),
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
        categories: { include: { category: true } },
        bet: true,
      },
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error('Create match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
