export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { reactions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityLogId } = await params
    const { emoji } = await request.json()

    if (!emoji || typeof emoji !== 'string') {
       return NextResponse.json({ error: 'Emoji is required' }, { status: 400 })
    }

    // Check if reaction exists
    const db = getDb()
    const existingList = await db.select().from(reactions).where(
      and(
        eq(reactions.activityLogId, activityLogId),
        eq(reactions.userId, session.user.id),
        eq(reactions.emoji, emoji)
      )
    )
    const existing = existingList[0]

    if (existing) {
      // Toggle off (remove)
      await db.delete(reactions).where(eq(reactions.id, existing.id))
      return NextResponse.json({ status: 'removed' })
    } else {
      // Add
      await db.insert(reactions).values({
        activityLogId,
        userId: session.user.id,
        emoji
      })
      return NextResponse.json({ status: 'added' })
    }

  } catch (error) {
    console.error('Reaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
