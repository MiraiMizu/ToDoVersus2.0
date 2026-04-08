import { ImageResponse } from '@vercel/og'
import { getDb } from '@/db'
import { matches } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch match data
    const db = getDb()
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
      with: {
        challenger: { columns: { username: true } },
        opponent: { columns: { username: true } },
        activityLogs: { columns: { userId: true, score: true } },
        winner: { columns: { username: true } }
      }
    })

    if (!match) {
      return new Response('Match not found', { status: 404 })
    }

    // Calculate total scores
    const challengerScore = match.activityLogs
      .filter((l: any) => l.userId === match.challengerId)
      .reduce((s: number, l: any) => s + l.score, 0)
    
    const opponentScore = match.activityLogs
      .filter((l: any) => l.userId === match.opponentId)
      .reduce((s: number, l: any) => s + l.score, 0)

    const isMatchEnded = match.status === 'COMPLETED'
    const winnerName = match.winner?.username || (isMatchEnded ? (challengerScore > opponentScore ? match.challenger.username : match.opponent.username) : null)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
            color: 'white',
            fontFamily: 'sans-serif',
            padding: '40px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
             <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', color: '#8b5cf6', textTransform: 'uppercase' }}>
               ToDoVersus
             </div>
          </div>

          {/* VS Card */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            width: '850px', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderRadius: '40px', 
            padding: '60px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            {/* Challenger */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '10px' }}>{match.challenger.username}</div>
              <div style={{ fontSize: '64px', fontWeight: '900', color: '#8b5cf6' }}>{challengerScore.toLocaleString()}</div>
              <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Points</div>
            </div>

            {/* VS Circle */}
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#8b5cf6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '900',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)'
            }}>VS</div>

            {/* Opponent */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '10px' }}>{match.opponent.username}</div>
              <div style={{ fontSize: '64px', fontWeight: '900', color: '#f59e0b' }}>{opponentScore.toLocaleString()}</div>
              <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Points</div>
            </div>
          </div>

          {/* Result Footer */}
          {winnerName ? (
            <div style={{ 
              marginTop: '40px', 
              fontSize: '28px', 
              fontWeight: 'bold', 
              backgroundColor: 'rgba(16, 185, 129, 0.15)', 
              color: '#10b981', 
              padding: '12px 40px', 
              borderRadius: '100px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              🏆 {winnerName} Victory!
            </div>
          ) : (
            <div style={{ marginTop: '40px', fontSize: '24px', color: '#64748b', fontWeight: 'medium' }}>⚔️ Match in Progress ⚔️</div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
