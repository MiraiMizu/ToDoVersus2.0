import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { verifyPassword } from '@/lib/auth-util'
import { getDb } from '@/db'
import { eq, or } from 'drizzle-orm'
import { users } from '@/db/schema'

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({

      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const db = getDb()
        const userList = await db.select().from(users).where(
          or(
            eq(users.email, credentials.email as string),
            eq(users.username, credentials.email as string)
          )
        )
        const user = userList[0]

        if (!user) return null

        const isValid = await verifyPassword(credentials.password as string, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.avatarUrl,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

// Server-side session helper
export async function getServerSession() {
  return await auth()
}
