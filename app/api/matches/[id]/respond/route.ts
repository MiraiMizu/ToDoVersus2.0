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
    const { action } = body // 'accept' | 'decline'

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

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        status: action === 'accept' ? 'ACTIVE' : 'DECLINED',
        startDate: action === 'accept' ? new Date() : undefined,
      },
      include: {
        challenger: { select: { id: true, username: true, avatarUrl: true } },
        opponent: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error('Respond to match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
