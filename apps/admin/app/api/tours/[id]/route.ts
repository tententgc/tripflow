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
        operator: true,
        members: { include: { user: true } },
        days: {
          include: {
            activities: true,
            transports: true,
            accommodation: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        flights: true,
        contacts: true,
        checklists: { include: { items: true } },
        emergencyInfo: true,
        documents: true,
        usefulPhrases: true,
      },
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Tour GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Record<string, unknown>

    const tour = await db.tour.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Tour PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
