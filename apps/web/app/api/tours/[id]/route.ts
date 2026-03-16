import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tour = await db.tour.findUnique({
      where: { id: params.id },
      include: {
        days: {
          include: {
            activities: { orderBy: { order: 'asc' } },
            transports: { orderBy: { order: 'asc' } },
            accommodation: true,
            dayItems: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        flights: true,
        contacts: true,
        checklists: { include: { items: { orderBy: { order: 'asc' } } } },
        emergencyInfo: true,
        documents: true,
        usefulPhrases: { orderBy: [{ category: 'asc' }, { order: 'asc' }] },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
                fcmToken: true,
                jpushId: true,
              },
            },
          },
        },
      },
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    return NextResponse.json(tour, {
      headers: {
        // Cache for 5 minutes, serve stale for 1 hour
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Tour GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
