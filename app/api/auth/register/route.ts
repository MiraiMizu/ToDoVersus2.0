import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth-util'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: { id: true, username: true, email: true, rank: true, createdAt: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error('Register error detail:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}
