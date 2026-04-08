export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { categories as catSchema } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const db = getDb()
    const categories = await db.select().from(catSchema).orderBy(desc(catSchema.weight))

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
