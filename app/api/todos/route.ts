export const runtime = 'edge';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/db'
import { eq, and } from 'drizzle-orm'
import { todos } from '@/db/schema'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  try {
    const db = getDb()
    let conditions = [eq(todos.userId, session.user.id)]
    if (date) conditions.push(eq(todos.date, date))
    
    const dbTodos = await db.select().from(todos).where(and(...conditions))
    // we return dbTodos as todos
    return NextResponse.json({ todos: dbTodos })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { content, date } = await req.json()
    if (!content || !date) return NextResponse.json({ error: 'Missing content or date' }, { status: 400 })

    const db = getDb()
    const result = await db.insert(todos).values({
      userId: session.user.id,
      content,
      date,
    }).returning()
    const todo = result[0]
    return NextResponse.json({ todo })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
