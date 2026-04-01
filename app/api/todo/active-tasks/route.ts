import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const activeMatches = await prisma.match.findMany({
      where: {
        OR: [
          { challengerId: session.user.id },
          { opponentId: session.user.id }
        ],
        status: 'ACTIVE'
      },
      include: {
        matchTasks: {
          include: {
            category: true
          }
        },
        challenger: { select: { username: true } },
        opponent: { select: { username: true } }
      }
    })

    const allTasks = activeMatches.flatMap((match: any) => 
      match.matchTasks.map((task: any) => ({
        ...task,
        matchOpponent: match.challengerId === session.user!.id ? match.opponent.username : match.challenger.username
      }))
    )

    return NextResponse.json({ matchTasks: allTasks })
  } catch (error) {
    console.error('Active tasks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
