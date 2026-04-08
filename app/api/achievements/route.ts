export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { achievements as achSchema } from '@/db/schema'
import { asc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const achievements = await db.select().from(achSchema).orderBy(asc(achSchema.rarity))

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
