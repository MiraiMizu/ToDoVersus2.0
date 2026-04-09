export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/db'
import { eq } from 'drizzle-orm'
import { todos } from '@/db/schema'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { isCompleted } = await req.json()
    const { id } = await params

    const db = getDb()
    const existingList = await db.select().from(todos).where(eq(todos.id, id))
    const existing = existingList[0]
    if (!existing) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    if (existing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await db.update(todos).set({ isCompleted }).where(eq(todos.id, id)).returning()
    const todo = result[0]
    return NextResponse.json({ todo })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    
    const db = getDb()
    const existingList = await db.select().from(todos).where(eq(todos.id, id))
    const existing = existingList[0]
    if (!existing) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    if (existing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.delete(todos).where(eq(todos.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
