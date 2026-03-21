import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id, dayId } = await params
    const body = await req.json() as Record<string, unknown>
    const day = await db.tourDay.update({
      where: { id: dayId },
      data: body,
    })
    logActivity({ actorName: 'Admin', action: 'day.update', entity: 'TourDay', entityId: dayId, tourId: id, description: 'แก้ไขวันเดินทาง' }).catch(() => {})

    return NextResponse.json(day)
  } catch (error) {
    console.error('Day PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id, dayId } = await params
    await db.tourDay.delete({ where: { id: dayId } })

    logActivity({ actorName: 'Admin', action: 'day.delete', entity: 'TourDay', entityId: dayId, tourId: id, description: 'ลบวันเดินทาง' }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Day DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
