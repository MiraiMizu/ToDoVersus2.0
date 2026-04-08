export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth-util'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { or, eq } from 'drizzle-orm'

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

    const db = getDb()
    const existingList = await db.select().from(users).where(
      or(eq(users.email, email), eq(users.username, username))
    )
    const existingUser = existingList[0]

    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const result = await db.insert(users).values({
      username,
      email,
      passwordHash,
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      rank: users.rank,
      createdAt: users.createdAt,
    })
    const user = result[0]

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
