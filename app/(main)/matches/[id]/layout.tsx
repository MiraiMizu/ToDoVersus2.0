import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        challenger: { select: { username: true } },
        opponent: { select: { username: true } },
      },
    })

    if (!match) return { title: 'Match Not Found' }

    const title = `${match.challenger.username} vs ${match.opponent.username} | ToDoVersus`
    const description = `Live productivity battle between ${match.challenger.username} and ${match.opponent.username}. Who will win?`
    const ogImage = `/api/og/match/${id}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: 'Match Results',
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    }
  } catch (e) {
    return { title: 'ToDoVersus Match' }
  }
}

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
