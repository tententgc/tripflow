import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tour = await db.tour.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as Record<string, unknown>

    const tour = await db.tour.update({
      where: { id },
      data: body,
    })

    // Log activity
    const changes = Object.keys(body)
    if (changes.includes('status')) {
      await logActivity({
        action: 'status.change',
        entity: 'Tour',
        entityId: id,
        description: `เปลี่ยนสถานะทัวร์ "${tour.title}" เป็น ${body.status as string}`,
        tourId: id,
      })
    } else {
      await logActivity({
        action: 'tour.update',
        entity: 'Tour',
        entityId: id,
        description: `แก้ไขข้อมูลทัวร์ "${tour.title}" (${changes.join(', ')})`,
        tourId: id,
      })
    }

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Tour PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
