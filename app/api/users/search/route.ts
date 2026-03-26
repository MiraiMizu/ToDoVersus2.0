import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { id: true, username: true, avatarUrl: true, rank: true, allTimeScore: true },
      take: 10,
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
