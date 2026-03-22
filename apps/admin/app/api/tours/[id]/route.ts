import { revalidateWebCache } from '@/lib/revalidate-web'
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
        operator: { select: { id: true, name: true, nameEn: true, logoUrl: true, primaryColor: true, phone: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, nameEn: true, email: true, phone: true, avatarUrl: true } },
          },
        },
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
        checklists: { include: { items: { orderBy: { order: 'asc' } } } },
        emergencyInfo: true,
        documents: true,
        usefulPhrases: { orderBy: { order: 'asc' } },
      },
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    const res = NextResponse.json(tour)
    res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return res
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

    revalidateWebCache(id)
    return NextResponse.json(tour)
  } catch (error) {
    console.error('Tour PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
