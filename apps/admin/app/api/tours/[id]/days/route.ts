import { revalidateWebCache } from '@/lib/revalidate-web'
import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      dayNumber: number
      date: string
      title: string
      city?: string
      country?: string
      mealBreakfast?: boolean
      mealLunch?: boolean
      mealDinner?: boolean
    }

    const day = await db.tourDay.create({
      data: {
        tourId: id,
        dayNumber: body.dayNumber,
        date: new Date(body.date),
        title: body.title,
        city: body.city ?? null,
        country: body.country ?? null,
        mealBreakfast: body.mealBreakfast ?? false,
        mealLunch: body.mealLunch ?? false,
        mealDinner: body.mealDinner ?? false,
      },
    })

    logActivity({ actorName: 'Admin', action: 'day.add', entity: 'TourDay', entityId: day.id, description: `เพิ่มวันที่ ${day.dayNumber}`, tourId: id }).catch(() => {})

    revalidateWebCache(id)
    return NextResponse.json(day, { status: 201 })
  } catch (error) {
    console.error('Day POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
