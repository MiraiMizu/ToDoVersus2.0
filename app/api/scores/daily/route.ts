export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { dailyScores as dsSchema } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!userId || !date) {
      return NextResponse.json({ error: 'userId and date are required' }, { status: 400 })
    }

    const db = getDb()
    const scores = await db.select().from(dsSchema).where(
      and(
        eq(dsSchema.userId, userId),
        eq(dsSchema.date, date)
      )
    )

    const totalScore = scores.reduce((sum: number, s: { totalScore: number }) => sum + s.totalScore, 0)

    return NextResponse.json({ scores, totalScore })
  } catch (error) {
    console.error('Daily scores error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
