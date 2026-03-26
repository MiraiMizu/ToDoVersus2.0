import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { rarity: 'asc' },
    })

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
