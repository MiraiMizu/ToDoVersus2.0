import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { isCompleted } = await req.json()
    const { id } = await params

    const existing = await prisma.todo.findUnique({ where: { id } })
    if (existing?.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const todo = await prisma.todo.update({
      where: { id },
      data: { isCompleted }
    })
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
    
    const existing = await prisma.todo.findUnique({ where: { id } })
    if (existing?.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.todo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
