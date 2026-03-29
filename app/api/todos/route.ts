import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  try {
    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        ...(date ? { date } : {})
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json({ todos })
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

    const todo = await prisma.todo.create({
      data: {
        userId: session.user.id,
        content,
        date,
      }
    })
    return NextResponse.json({ todo })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
