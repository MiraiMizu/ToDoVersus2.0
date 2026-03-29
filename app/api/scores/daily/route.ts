import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!userId || !date) {
      return NextResponse.json({ error: 'userId and date are required' }, { status: 400 })
    }

    const scores = await prisma.dailyScore.findMany({
      where: { userId, date },
    })

    const totalScore = scores.reduce((sum: number, s: { totalScore: number }) => sum + s.totalScore, 0)

    return NextResponse.json({ scores, totalScore })
  } catch (error) {
    console.error('Daily scores error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
