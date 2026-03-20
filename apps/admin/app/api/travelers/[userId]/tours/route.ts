import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

// POST assign traveler to a tour
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { tourId } = await req.json() as { tourId: string }

    const member = await db.tourMember.upsert({
      where: { tourId_userId: { tourId, userId } },
      create: { tourId, userId, role: 'MEMBER' },
      update: {},
      include: {
        tour: { select: { id: true, title: true, startDate: true, endDate: true, primaryCountry: true, isChina: true, status: true } },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('POST assign tour error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// DELETE remove traveler from a tour
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { tourId } = await req.json() as { tourId: string }

    await db.tourMember.delete({ where: { tourId_userId: { tourId, userId } } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE assign tour error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
