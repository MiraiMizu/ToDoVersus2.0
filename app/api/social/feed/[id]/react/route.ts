import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const existing = await prisma.reaction.findUnique({
      where: {
        activityLogId_userId_emoji: {
          activityLogId,
          userId: session.user.id,
          emoji,
        }
      }
    })

    if (existing) {
      // Toggle off (remove)
      await prisma.reaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ status: 'removed' })
    } else {
      // Add
      await prisma.reaction.create({
        data: {
          activityLogId,
          userId: session.user.id,
          emoji
        }
      })
      return NextResponse.json({ status: 'added' })
    }

  } catch (error) {
    console.error('Reaction API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
